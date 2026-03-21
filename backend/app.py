from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import IntegrityError
import os
import time
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app)

# Конфигурация базы данных
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'conresed'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

# Установка соединения с базой данных
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

if __name__ == '__main__':
    if not wait_for_db():
        raise RuntimeError("Could not connect to database after retries")
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)