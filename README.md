# ConResEd

### Что работает:
- Backend на Flask (Python)
- Database (PostgreSQL)
- Frontend (HTML/JS)
- Интеграция: UI → Backend → DB

### Старт:

#### 1. Backend (Flask + PostgreSQL)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Backend запустится на http://localhost:5000

#### 2. Frontend
Просто откройте `frontend/index.html` в браузере.

### Проверка работы:
1. Запустите backend
2. Откройте frontend
3. Нажмите кнопку "Получить Hello World из БД"
4. Увидите сообщение из базы данных: `{"message": "Hello World"}`
