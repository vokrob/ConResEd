import re

def _norm_key(placeholder):
    mapping = {
        "фамилия": "last_name",
        "имя": "first_name",
        "отчество": "middle_name",
        "должность": "position",
        "email": "email",
        "телефон": "phone",
        "город": "city",
        "локация": "city",
        "о себе": "about",
        "краткое описание вашего профессионального опыта": "about",
        "расскажите о себе": "about",
        "расскажите свою историю": "about",
        "компания": "company",
        "название компании": "company",
        "период": "period",
        "период работы": "period",
        "описание": "description",
        "описание обязанностей": "description",
        "степень": "education_degree",
        "степень / специальность": "education_degree",
        "год": "education_year",
        "год окончания": "education_year",
        "учебное заведение": "education_place",
        "по запросу": "additional",
        "ваши интересы": "additional",
    }
    p_lower = placeholder.lower()
    return mapping.get(p_lower, placeholder.lower().replace(" ", "_"))

def _make_key(group, placeholder, index):
    norm = _norm_key(placeholder)
    return f"{group}::{norm}::{index}"

def _split_full_name(full_name):
    parts = full_name.split()
    last = parts[0] if len(parts) > 0 else ""
    first = parts[1] if len(parts) > 1 else ""
    middle = parts[2] if len(parts) > 2 else ""
    return last, first, middle

def _extract_links(links_list):
    result = {
        "website": "",
        "github": "",
        "linkedin": "",
        "hhru": "",
    }
    if not links_list:
        return result
    for link in links_list:
        t = (link.get("type") or "").lower()
        url = (link.get("url") or "").strip()
        if not url:
            continue
        if t in ("website", "portfolio"):
            result["website"] = url
        elif t == "github":
            result["github"] = url
        elif t == "linkedin":
            result["linkedin"] = url
        elif t == "hh" or "hh.ru" in url:
            result["hhru"] = url
    return result

def map_classic(data):
    m = {}
    last, first, middle = _split_full_name(data.get("fullName") or "")
    m[_make_key("general", "Фамилия", 0)] = last
    m[_make_key("general", "Имя", 0)] = first
    m[_make_key("general", "Отчество", 0)] = middle
    m[_make_key("general", "Должность", 0)] = data.get("position") or ""
    m[_make_key("general", "Email", 0)] = data.get("email") or ""
    m[_make_key("general", "Телефон", 0)] = data.get("phone") or ""
    m[_make_key("general", "Город", 0)] = data.get("city") or ""
    m[_make_key("general", "Краткое описание вашего профессионального опыта", 0)] = data.get("summary") or ""

    experiences = data.get("experience") or []
    exp_count = min(len(experiences), 10)
    for i in range(exp_count):
        exp = experiences[i]
        m[_make_key("experience", "Должность", i)] = exp.get("title") or ""
        m[_make_key("experience", "Период работы", i)] = exp.get("period") or ""
        m[_make_key("experience", "Название компании", i)] = exp.get("company") or ""
        m[_make_key("experience", "Описание обязанностей", i)] = exp.get("description") or ""

    education = data.get("education") or []
    edu_count = min(len(education), 10)
    for i in range(edu_count):
        edu = education[i]
        m[_make_key("education", "Степень / Специальность", i)] = edu.get("degree") or edu.get("specialization") or ""
        m[_make_key("education", "Год окончания", i)] = edu.get("period") or ""
        m[_make_key("education", "Учебное заведение", i)] = edu.get("institution") or ""

    skills = data.get("skills") or []
    skill_count = min(len(skills), 20)
    for i in range(skill_count):
        m[_make_key("general", "Навык", i)] = skills[i]

    extra_parts = []
    for lang in data.get("languages") or []:
        extra_parts.append(f"{lang.get('name','')}: {lang.get('level','')}")
    for cert in data.get("certificates") or []:
        extra_parts.append(cert.get("name",""))
    m[_make_key("general", "Языки, сертификаты, курсы", 0)] = "; ".join(extra_parts)

    counts = {"experience": exp_count, "education": edu_count, "skills": skill_count}
    return m, counts

def map_modern(data):
    m = {}
    last, first, middle = _split_full_name(data.get("fullName") or "")
    m[_make_key("general", "Фамилия", 0)] = last
    m[_make_key("general", "Имя", 0)] = first
    m[_make_key("general", "Отчество", 0)] = middle
    m[_make_key("general", "Должность", 0)] = data.get("position") or ""
    m[_make_key("general", "Email", 0)] = data.get("email") or ""
    m[_make_key("general", "Телефон", 0)] = data.get("phone") or ""
    m[_make_key("general", "Город", 0)] = data.get("city") or ""

    links = _extract_links(data.get("links"))
    m[_make_key("general", "hh.ru", 0)] = links.get("hhru", "")
    m[_make_key("general", "Расскажите о себе", 0)] = data.get("summary") or ""

    experiences = data.get("experience") or []
    exp_count = min(len(experiences), 10)
    for i in range(exp_count):
        exp = experiences[i]
        m[_make_key("experience", "Должность", i)] = exp.get("title") or ""
        m[_make_key("experience", "Период", i)] = exp.get("period") or ""
        m[_make_key("experience", "Компания", i)] = exp.get("company") or ""
        m[_make_key("experience", "Описание", i)] = exp.get("description") or ""

    education = data.get("education") or []
    edu_count = min(len(education), 10)
    for i in range(edu_count):
        edu = education[i]
        m[_make_key("education", "Степень", i)] = edu.get("degree") or edu.get("specialization") or ""
        m[_make_key("education", "Год", i)] = edu.get("period") or ""
        m[_make_key("education", "Учебное заведение", i)] = edu.get("institution") or ""

    skills = data.get("skills") or []
    skill_count = min(len(skills), 15)
    for i in range(skill_count):
        m[_make_key("general", "Навык", i)] = skills[i]

    langs = data.get("languages") or []
    lang_count = min(len(langs), 5)
    for i in range(lang_count):
        lang = langs[i]
        m[_make_key("general", "Язык", i)] = lang.get("name") or ""
        m[_make_key("general", "Уровень", i)] = lang.get("level") or ""

    m[_make_key("general", "Ваши интересы", 0)] = ""
    counts = {"experience": exp_count, "education": edu_count, "skills": skill_count, "languages": lang_count}
    return m, counts

def map_creative(data):
    m = {}
    last, first, middle = _split_full_name(data.get("fullName") or "")
    m[_make_key("general", "Фамилия", 0)] = last
    m[_make_key("general", "Имя", 0)] = first
    m[_make_key("general", "Отчество", 0)] = middle
    m[_make_key("general", "Должность", 0)] = data.get("position") or ""
    m[_make_key("general", "Ваш слоган или краткое описание", 0)] = data.get("summary") or ""
    for idx in range(3):
        m[_make_key("general", "", idx)] = ""

    m[_make_key("general", "Email", 0)] = data.get("email") or ""
    m[_make_key("general", "Телефон", 0)] = data.get("phone") or ""
    links = _extract_links(data.get("links"))
    m[_make_key("general", "Сайт", 0)] = links.get("website", "")
    m[_make_key("general", "hh.ru", 0)] = links.get("hhru", "")
    m[_make_key("general", "Локация", 0)] = data.get("city") or ""

    skills = data.get("skills") or []
    skill_count = min(len(skills), 10)
    for i in range(skill_count):
        m[_make_key("general", "Навык", i)] = skills[i]

    m[_make_key("general", "", 3)] = ""
    m[_make_key("general", "Расскажите свою историю", 0)] = data.get("summary") or ""

    experiences = data.get("experience") or []
    exp_count = min(len(experiences), 10)
    for i in range(exp_count):
        exp = experiences[i]
        m[_make_key("experience", "Должность", i)] = exp.get("title") or ""
        m[_make_key("experience", "Период", i)] = exp.get("period") or ""
        m[_make_key("experience", "Компания", i)] = exp.get("company") or ""
        m[_make_key("experience", "Описание", i)] = exp.get("description") or ""

    education = data.get("education") or []
    edu_count = min(len(education), 10)
    for i in range(edu_count):
        edu = education[i]
        m[_make_key("education", "Степень", i)] = edu.get("degree") or edu.get("specialization") or ""
        m[_make_key("education", "Год", i)] = edu.get("period") or ""
        m[_make_key("education", "Учебное заведение", i)] = edu.get("institution") or ""

    m[_make_key("general", "", 4)] = ""
    counts = {"experience": exp_count, "education": edu_count, "skills": skill_count}
    return m, counts

def map_professional(data):
    m = {}
    m[_make_key("general", "Email", 0)] = data.get("email") or ""
    m[_make_key("general", "Телефон", 0)] = data.get("phone") or ""
    links = _extract_links(data.get("links"))
    m[_make_key("general", "hh.ru", 0)] = links.get("hhru", "")
    m[_make_key("general", "Город", 0)] = data.get("city") or ""

    last, first, middle = _split_full_name(data.get("fullName") or "")
    m[_make_key("general", "Фамилия", 0)] = last
    m[_make_key("general", "Имя", 0)] = first
    m[_make_key("general", "Отчество", 0)] = middle
    m[_make_key("general", "Сертификаты", 0)] = ""
    m[_make_key("general", "Должность", 0)] = data.get("position") or ""
    m[_make_key("general", "Краткое описание вашего профессионального опыта", 0)] = data.get("summary") or ""

    experiences = data.get("experience") or []
    exp_count = min(len(experiences), 10)
    for i in range(exp_count):
        exp = experiences[i]
        m[_make_key("experience", "Должность", i)] = exp.get("title") or ""
        m[_make_key("experience", "Период", i)] = exp.get("period") or ""
        m[_make_key("experience", "Компания", i)] = exp.get("company") or ""
        m[_make_key("experience", " | Город", i)] = exp.get("location") or ""
        m[_make_key("experience", "Описание обязанностей", i)] = exp.get("description") or ""
        m[_make_key("experience", "Достижение", i)] = ""

    education = data.get("education") or []
    edu_count = min(len(education), 10)
    for i in range(edu_count):
        edu = education[i]
        m[_make_key("education", "Степень", i)] = edu.get("degree") or edu.get("specialization") or ""
        m[_make_key("education", "Год", i)] = edu.get("period") or ""
        m[_make_key("education", "Учебное заведение", i)] = edu.get("institution") or ""

    skills = data.get("skills") or []
    skill_count = min(len(skills), 20)
    m[_make_key("general", "Категория", 0)] = ""
    for i in range(skill_count):
        m[_make_key("general", "Навык", i)] = skills[i]

    certs = data.get("certificates") or []
    cert_count = min(len(certs), 5)
    for i in range(cert_count):
        cert = certs[i]
        m[_make_key("general", "Название", i)] = cert.get("name") or ""
        m[_make_key("general", "Организация", i)] = cert.get("issuer") or ""
        m[_make_key("general", "Год", i)] = cert.get("year") or ""

    langs = data.get("languages") or []
    lang_count = min(len(langs), 5)
    for i in range(lang_count):
        lang = langs[i]
        m[_make_key("general", "Язык", i)] = lang.get("name") or ""
        m[_make_key("general", "Уровень", i)] = lang.get("level") or ""

    m[_make_key("general", "По запросу", 0)] = ""
    counts = {"experience": exp_count, "education": edu_count, "skills": skill_count, "certificates": cert_count, "languages": lang_count}
    return m, counts

def map_it(data):
    m = {}
    last, first, middle = _split_full_name(data.get("fullName") or "")
    m[_make_key("general", "Фамилия", 0)] = last
    m[_make_key("general", "Имя", 0)] = first
    m[_make_key("general", "Отчество", 0)] = middle
    m[_make_key("general", "Должность", 0)] = data.get("position") or ""
    m[_make_key("general", "Email", 0)] = data.get("email") or ""
    m[_make_key("general", "Телефон", 0)] = data.get("phone") or ""
    m[_make_key("general", "Город", 0)] = data.get("city") or ""

    links = _extract_links(data.get("links"))
    m[_make_key("general", "LinkedIn / GitHub", 0)] = links.get("linkedin") or links.get("github") or ""
    m[_make_key("general", "Краткое описание вашего опыта в IT", 0)] = data.get("summary") or ""

    experiences = data.get("experience") or []
    exp_count = min(len(experiences), 10)
    for i in range(exp_count):
        exp = experiences[i]
        m[_make_key("experience", "Должность", i)] = exp.get("title") or ""
        m[_make_key("experience", "Период", i)] = exp.get("period") or ""
        m[_make_key("experience", "Компания", i)] = exp.get("company") or ""
        m[_make_key("experience", "Обязанности и достижения", i)] = exp.get("description") or ""

    education = data.get("education") or []
    edu_count = min(len(education), 10)
    for i in range(edu_count):
        edu = education[i]
        m[_make_key("education", "Степень / Специальность", i)] = edu.get("degree") or edu.get("specialization") or ""
        m[_make_key("education", "Год окончания", i)] = edu.get("period") or ""
        m[_make_key("education", "Учебное заведение", i)] = edu.get("institution") or ""

    skills = data.get("skills") or []
    tech_count = min(len(skills), 15)
    for i in range(tech_count):
        m[_make_key("general", "Технология / Инструмент", i)] = skills[i]

    certs = data.get("certificates") or []
    cert_count = min(len(certs), 5)
    for i in range(cert_count):
        cert = certs[i]
        m[_make_key("general", "Название сертификата", i)] = cert.get("name") or ""
        m[_make_key("general", "Организация", i)] = cert.get("issuer") or ""
        m[_make_key("general", "Год получения", i)] = cert.get("year") or ""

    extra = []
    for lang in data.get("languages") or []:
        extra.append(f"{lang.get('name','')}: {lang.get('level','')}")
    m[_make_key("general", "Языки, дополнительные курсы", 0)] = "; ".join(extra)

    counts = {"experience": exp_count, "education": edu_count, "tech": tech_count, "certificates": cert_count, "projects": 1}
    return m, counts

def map_gigachat_data(template_id, data):
    if template_id == "classic":
        return map_classic(data)
    elif template_id == "modern":
        return map_modern(data)
    elif template_id == "creative":
        return map_creative(data)
    elif template_id == "professional":
        return map_professional(data)
    elif template_id == "it":
        return map_it(data)
    else:
        return map_classic(data)

def build_warnings(template_id, data):
    warnings = []
    if not data.get("email"):
        warnings.append("Не удалось распознать Email")
    if not data.get("phone"):
        warnings.append("Не удалось распознать телефон")
    exp = data.get("experience") or []
    if len(exp) > 10:
        warnings.append("Показаны только первые 10 мест работы")
    if not exp:
        warnings.append("Опыт работы не указан")
    if not data.get("skills"):
        warnings.append("Навыки не найдены")
    return warnings