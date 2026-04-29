from flask import Blueprint, request, jsonify, session
import os
import json
import re
import requests
import pdfplumber
from docx import Document
from resume_mapper import map_gigachat_data, build_warnings

parse_bp = Blueprint('parser', __name__)

GIGACHAT_TOKEN = os.getenv("GIGACHAT_TOKEN")
GIGACHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

def normalize_phone(phone):
    if not phone:
        return ""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 11 and digits.startswith(('7', '8')):
        formatted = f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
        return formatted
    if len(digits) == 10 and digits.startswith('9'):
        formatted = f"+7 ({digits[0:3]}) {digits[3:6]}-{digits[6:8]}-{digits[8:10]}"
        return formatted
    return phone.strip()

def validate_email(email):
    if not email:
        return "", None
    email = email.strip().lower()
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if re.match(pattern, email):
        return email, None
    return "", "Некорректный email"

def normalize_period(period):
    if not period:
        return ""
    period = period.strip()
    period = re.sub(r'\bн\.\s*в\.\b', 'Настоящее время', period, flags=re.IGNORECASE)
    return period

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_text_from_file(file, filename):
    ext = filename.rsplit('.', 1)[1].lower()
    try:
        if ext == 'pdf':
            with pdfplumber.open(file) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        elif ext == 'docx':
            doc = Document(file)
            return "\n".join(para.text for para in doc.paragraphs)
        elif ext == 'txt':
            return file.read().decode('utf-8')
        return None
    except Exception:
        return None

@parse_bp.route('/parse', methods=['POST'])
def parse_resume():
    if 'user_id' not in session:
        return jsonify({"error": "Не авторизован"}), 401
    
    if 'file' not in request.files:
        return jsonify({"error": "Файл не прикреплён"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Файл не выбран"}), 400
    
    text_content = extract_text_from_file(file, file.filename)
    if not text_content or len(text_content.strip()) < 50:
        return jsonify({"error": "Текста в файле слишком мало для анализа"}), 400
    
    try:
        prompt = f"""
Ты — профессиональный парсер резюме. Верни СТРОГО валидный JSON без пояснений.
НЕ добавляй лишних полей. Если поле не найдено — ставь "" или [].

Структура (ключи без пробелов!):
{{
  "fullName": "",
  "position": "",
  "email": "",
  "phone": "",
  "city": "",
  "summary": "",
  "targetPosition": "",
  "links": [{{"type": "", "url": "", "label": ""}}],
  "experience": [{{"company": "", "title": "", "period": "", "description": "", "location": ""}}],
  "education": [{{"institution": "", "faculty": "", "degree": "", "period": "", "specialization": ""}}],
  "skills": [""],
  "languages": [{{"name": "", "level": ""}}],
  "certificates": [{{"name": "", "issuer": "", "year": ""}}]
}}

ПРАВИЛА НОРМАЛИЗАЦИИ:
1. ТЕЛЕФОН (только РФ): 
   - Если номер начинается на 7 или 8 (например, 7999..., 8999..., +7..., +8...), замени префикс на +7.
   - Приведи формат строго к: "+7 XXX XXX XX XX" (только пробелы, без скобок, тире и точек).
   - Пример: "8(999)123-45.67" заменится на "+7 999 123 45 67".
   - Если цифр меньше 10 — оставь "".
   - Если номер не начинается на 7 или 8 (международный) — оставь как есть, убрав только лишние пробелы.
2. EMAIL: Только чистый адрес без пробелов и знаков препинания в конце.
3. ДАТЫ (period): "Месяц Год – Месяц Год". Сокращения "н.в." заменяй на полное значение "Настоящее время".
4. ССЫЛКИ: В "url" только сама ссылка (желательно с https://). Type: "github", "linkedin", "portfolio", "website".
5. НАВЫКИ: Каждый навык — отдельный элемент массива.
6. ЯЗЫКИ: В languages.level пиши строго: "A1", "A2", "B1", "B2", "C1", "C2", "родной" или "".

Текст резюме: --- {text_content[:8000]} ---
"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GIGACHAT_TOKEN}"
        }
        payload = {
            "model": "GigaChat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 2000
        }
        
        response = requests.post(GIGACHAT_URL, headers=headers, json=payload, timeout=30, verify=False)
        response.raise_for_status()
        
        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        content = content.replace("```json", "").replace("```", "").strip()
        raw_data = json.loads(content)

        raw_data["phone"] = normalize_phone(raw_data.get("phone"))
        raw_email, email_warning = validate_email(raw_data.get("email"))
        if email_warning:
            raw_data["email"] = ""
        else:
            raw_data["email"] = raw_email

        for exp in raw_data.get("experience") or []:
            exp["period"] = normalize_period(exp.get("period"))
        for edu in raw_data.get("education") or []:
            edu["period"] = normalize_period(edu.get("period"))

        raw_data["summary"] = clean_text(raw_data.get("summary"))
        for exp in raw_data.get("experience") or []:
            exp["description"] = clean_text(exp.get("description"))
            exp["company"] = clean_text(exp.get("company"))

        template_id = request.form.get("template_id", "classic").strip().lower()
        mapped, counts = map_gigachat_data(template_id, raw_data)
        warnings = build_warnings(template_id, raw_data)

        return jsonify({
            "success": True,
            "mappedData": mapped,
            "warnings": warnings,
            "counts": counts
        }), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Ошибка запроса к GigaChat: {str(e)}"}), 500
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Невалидный JSON от ИИ: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Ошибка обработки: {str(e)}"}), 500