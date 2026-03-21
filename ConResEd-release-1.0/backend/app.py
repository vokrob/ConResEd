from flask import Flask, jsonify, request, session, send_from_directory, abort
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import IntegrityError
import os
import time
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

ALLOWED_RESUME_TEMPLATES = {
    'classic.html',
    'modern.html',
    'creative.html',
    'professional.html',
}
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')

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
    conn.commit()
    cur.close()
    conn.close()

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

@app.route('/templates/<path:template_name>', methods=['GET'])
def serve_template(template_name):
    normalized_name = template_name.strip().lower()
    if not normalized_name.endswith('.html'):
        normalized_name = f'{normalized_name}.html'
    if normalized_name not in ALLOWED_RESUME_TEMPLATES:
        abort(404)
    return send_from_directory(TEMPLATES_DIR, normalized_name)

if __name__ == '__main__':
    if not wait_for_db():
        raise RuntimeError("Could not connect to database after retries")
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)