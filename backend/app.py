from flask import Flask, jsonify, request, session
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import IntegrityError
import os
import time
import json
import secrets
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
CORS(app, supports_credentials=True)

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'conresed'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn

def wait_for_db(max_retries=20, delay=2):
    for attempt in range(1, max_retries + 1):
        try:
            conn = get_db_connection()
            conn.close()
            return True
        except Exception as err:
            print(f"DB not ready ({attempt}/{max_retries}): {err}")
            time.sleep(delay)
    return False

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS app_status (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL
        );
        """
    )
    cur.execute("SELECT COUNT(*) FROM app_status;")
    count = cur.fetchone()[0]
    if count == 0:
        cur.execute("INSERT INTO app_status (message) VALUES (%s);", ("Hello World",))

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS saved_resumes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            template_id TEXT NOT NULL,
            title TEXT NOT NULL,
            payload JSONB NOT NULL,
            public_token TEXT UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    # Backward-compatible migration for older databases
    try:
        cur.execute("ALTER TABLE saved_resumes ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;")
    except Exception:
        pass
    conn.commit()
    cur.close()
    conn.close()

def generate_public_token():
    # Short, URL-safe, low collision risk
    return secrets.token_urlsafe(18)

def ensure_public_token_for_resume(cur, resume_id):
    for _ in range(5):
        token = generate_public_token()
        try:
            cur.execute("SAVEPOINT sp_public_token;")
            cur.execute(
                """
                UPDATE saved_resumes
                SET public_token = %s
                WHERE id = %s AND (public_token IS NULL OR public_token = '')
                RETURNING public_token;
                """,
                (token, resume_id),
            )
            row = cur.fetchone()
            cur.execute("RELEASE SAVEPOINT sp_public_token;")
            if row and row.get("public_token"):
                return row["public_token"]
        except IntegrityError:
            # Token collision — retry with a new token
            try:
                cur.execute("ROLLBACK TO SAVEPOINT sp_public_token;")
                cur.execute("RELEASE SAVEPOINT sp_public_token;")
            except Exception:
                pass
    return None

@app.route('/api/hello', methods=['GET'])
def hello_world():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT message FROM app_status ORDER BY id DESC LIMIT 1;")
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        return jsonify({'message': result[0]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT 1 as ok;")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({'status': 'healthy', 'db': result['ok'] == 1}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500


@app.route('/api/register', methods=['POST'])
def register():
    conn = None
    cur = None
    try:
        payload = request.get_json(silent=True) or {}
        email = (payload.get('email') or '').strip().lower()
        full_name = (payload.get('full_name') or '').strip()
        password = payload.get('password') or ''

        if not email or not full_name or not password:
            return jsonify({'error': 'email, full_name и password обязательны'}), 400
        if '@' not in email or len(email) < 5:
            return jsonify({'error': 'Некорректный email'}), 400
        if len(password) < 8:
            return jsonify({'error': 'Пароль должен быть не короче 8 символов'}), 400
        if len(full_name) < 2:
            return jsonify({'error': 'Имя должно быть не короче 2 символов'}), 400

        password_hash = generate_password_hash(password)

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            INSERT INTO users (email, full_name, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, email, full_name, created_at;
            """,
            (email, full_name, password_hash)
        )
        user = cur.fetchone()
        conn.commit()

        return jsonify({'message': 'Пользователь зарегистрирован', 'user': user}), 201
    except IntegrityError:
        if conn:
            conn.rollback()
        return jsonify({'error': 'Пользователь с таким email уже существует'}), 409
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/login', methods=['POST'])
def login():
    conn = None
    cur = None
    try:
        payload = request.get_json(silent=True) or {}
        email = (payload.get('email') or '').strip().lower()
        password = payload.get('password') or ''

        if not email or not password:
            return jsonify({'error': 'email и password обязательны'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT id, email, full_name, password_hash, created_at
            FROM users
            WHERE email = %s
            LIMIT 1;
            """,
            (email,)
        )
        user = cur.fetchone()

        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Неверный email или пароль'}), 401

        session['user_id'] = user['id']
        session['user_email'] = user['email']

        safe_user = {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'created_at': user['created_at']
        }
        return jsonify({'message': 'Вход выполнен успешно', 'user': safe_user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не авторизован'}), 401

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT id, email, full_name, created_at
            FROM users
            WHERE id = %s
            LIMIT 1;
            """,
            (user_id,)
        )
        user = cur.fetchone()

        if not user:
            session.clear()
            return jsonify({'error': 'Пользователь не найден'}), 401

        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Вы вышли из аккаунта'}), 200

@app.route('/api/resumes', methods=['GET'])
def list_resumes():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не авторизован'}), 401
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT id, template_id, title, public_token, created_at, updated_at
            FROM saved_resumes
            WHERE user_id = %s
            ORDER BY updated_at DESC, id DESC;
            """,
            (user_id,)
        )
        rows = cur.fetchall()
        # Ensure every row has a public token (for legacy data)
        updated = False
        for r in rows:
            if not r.get("public_token"):
                token = ensure_public_token_for_resume(cur, r["id"])
                if token:
                    r["public_token"] = token
                    updated = True
        if updated:
            conn.commit()
        return jsonify({'items': rows}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/resumes', methods=['POST'])
def save_resume():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не авторизован'}), 401
    payload = request.get_json(silent=True) or {}
    template_id = (payload.get('template_id') or '').strip().lower()
    title = (payload.get('title') or '').strip()
    data = payload.get('payload')
    if template_id not in {'classic', 'modern', 'creative', 'professional', 'it'}:
        return jsonify({'error': 'Некорректный template_id'}), 400
    if not title:
        title = f"Резюме ({template_id})"
    if not isinstance(data, dict):
        return jsonify({'error': 'Некорректный payload'}), 400
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT 1
            FROM saved_resumes
            WHERE user_id = %s AND title = %s
            LIMIT 1;
            """,
            (user_id, title)
        )
        if cur.fetchone():
            return jsonify({'error': 'Резюме с таким названием уже существует'}), 409
        row = None
        for _ in range(5):
            try:
                cur.execute(
                    """
                    INSERT INTO saved_resumes (user_id, template_id, title, payload, public_token)
                    VALUES (%s, %s, %s, %s::jsonb, %s)
                    RETURNING id, template_id, title, public_token, created_at, updated_at;
                    """,
                    (user_id, template_id, title, json.dumps(data, ensure_ascii=False), generate_public_token()),
                )
                row = cur.fetchone()
                break
            except IntegrityError:
                conn.rollback()
                cur = conn.cursor(cursor_factory=RealDictCursor)
                # If title uniqueness caused it — surface a clear error
                cur.execute(
                    """
                    SELECT 1
                    FROM saved_resumes
                    WHERE user_id = %s AND title = %s
                    LIMIT 1;
                    """,
                    (user_id, title),
                )
                if cur.fetchone():
                    return jsonify({'error': 'Резюме с таким названием уже существует'}), 409
                # Otherwise assume token collision and retry
                continue
        if not row:
            return jsonify({'error': 'Не удалось сгенерировать публичную ссылку'}), 500
        conn.commit()
        return jsonify({'item': row, 'message': 'Шаблон сохранен'}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/resumes/<int:resume_id>', methods=['GET'])
def get_resume(resume_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не авторизован'}), 401
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT id, template_id, title, payload, public_token, created_at, updated_at
            FROM saved_resumes
            WHERE id = %s AND user_id = %s
            LIMIT 1;
            """,
            (resume_id, user_id)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Шаблон не найден'}), 404
        if not row.get("public_token"):
            token = ensure_public_token_for_resume(cur, resume_id)
            if token:
                row["public_token"] = token
                conn.commit()
        return jsonify({'item': row}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/resumes/<int:resume_id>', methods=['PUT'])
def update_resume(resume_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не авторизован'}), 401
    payload = request.get_json(silent=True) or {}
    title = (payload.get('title') or '').strip()
    data = payload.get('payload')
    if not title:
        return jsonify({'error': 'Название обязательно'}), 400
    if not isinstance(data, dict):
        return jsonify({'error': 'Некорректный payload'}), 400
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT 1
            FROM saved_resumes
            WHERE user_id = %s AND title = %s AND id <> %s
            LIMIT 1;
            """,
            (user_id, title, resume_id)
        )
        if cur.fetchone():
            return jsonify({'error': 'Резюме с таким названием уже существует'}), 409
        cur.execute(
            """
            UPDATE saved_resumes
            SET title = %s, payload = %s::jsonb, updated_at = NOW()
            WHERE id = %s AND user_id = %s
            RETURNING id, template_id, title, public_token, created_at, updated_at;
            """,
            (title, json.dumps(data, ensure_ascii=False), resume_id, user_id)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Шаблон не найден'}), 404
        if not row.get("public_token"):
            token = ensure_public_token_for_resume(cur, resume_id)
            if token:
                row["public_token"] = token
        conn.commit()
        return jsonify({'item': row, 'message': 'Шаблон обновлен'}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/resumes/<int:resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не авторизован'}), 401
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            DELETE FROM saved_resumes
            WHERE id = %s AND user_id = %s
            RETURNING id;
            """,
            (resume_id, user_id)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Шаблон не найден'}), 404
        conn.commit()
        return jsonify({'message': 'Шаблон удален'}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/public/resumes/<string:token>', methods=['GET'])
def get_public_resume(token):
    token = (token or "").strip()
    if not token or len(token) < 8:
        return jsonify({"error": "Некорректный токен"}), 400
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT template_id, title, payload, updated_at
            FROM saved_resumes
            WHERE public_token = %s
            LIMIT 1;
            """,
            (token,),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Шаблон не найден"}), 404
        return jsonify({"item": row}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    if not wait_for_db():
        raise RuntimeError("Could not connect to database after retries")
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)