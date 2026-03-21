# ConResEd

Конвертер и редактор резюме (PoC): frontend + backend + PostgreSQL.

## Что уже готово в PoC
- Backend на Flask (`/api/hello`, `/api/health`)
- Регистрация пользователя (`POST /api/register`)
- PostgreSQL с инициализацией тестовых данных
- Frontend на HTML/JS
- Интеграция UI -> Backend -> DB

## Быстрый запуск (рекомендуется)
```bash
docker compose up --build
```

После запуска:
- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## Ручной запуск (без Docker)
1) Запустить PostgreSQL локально (БД `conresed`, пользователь `postgres`, пароль `postgres`).

2) Запустить backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

3) Открыть `frontend/index.html` в браузере.

## Проверка работы
1. Откройте frontend.
2. Нажмите кнопку "Получить Hello World из БД".
3. В блоке результата должно появиться: `{"message":"Hello World"}`.
4. В блоке "Регистрация" заполните поля и нажмите "Зарегистрироваться".
5. При успешной регистрации API вернет `message` и данные пользователя (без пароля).

## Материалы к демо
- `docs/V1_REQUIREMENTS.md` - исправленные общие требования (ветка `v1`)
- `docs/RELEASE_1_0_SCOPE.md` - вырезка требований под PoC (ветка `release/1.0`)
- `docs/DEMO_SCRIPT.md` - сценарий выступления до 10 минут
