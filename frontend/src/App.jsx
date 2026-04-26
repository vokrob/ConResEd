import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:8080/api";
const TEMPLATE_BASE_URL = "http://localhost:8080/templates";

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState({
    register: false,
    login: false,
    logout: false,
  });

  const [registerResult, setRegisterResult] = useState("");
  const [loginResult, setLoginResult] = useState("");
  const [meResult, setMeResult] = useState("");

  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus((prev) => ({ ...prev, type: "" }));
    }, 5000);
    return () => clearTimeout(timer);
  }, [status.message]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  async function registerUser(event) {
    event.preventDefault();
    const fullName = registerForm.fullName.trim();
    const email = registerForm.email.trim();
    const password = registerForm.password;

    if (!fullName || !email || !password) {
      setStatus({ message: "Заполните все поля регистрации", type: "error" });
      return;
    }

    setLoading((prev) => ({ ...prev, register: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      setRegisterResult(pretty(data));
      setStatus({ message: "Регистрация выполнена успешно", type: "success" });
      setLoginForm((prev) => ({ ...prev, email }));
      setRegisterForm({ fullName: "", email: "", password: "" });
    } catch (error) {
      setRegisterResult(`Error: ${error.message}`);
      setStatus({ message: error.message || "Ошибка регистрации", type: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, register: false }));
    }
  }

  async function loginUser(event) {
    event.preventDefault();
    const email = loginForm.email.trim();
    const password = loginForm.password;

    if (!email || !password) {
      setStatus({ message: "Введите email и пароль", type: "error" });
      return;
    }

    setLoading((prev) => ({ ...prev, login: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка входа");
      }

      setLoginResult(pretty(data));
      setMeResult(pretty(data.user));
      setStatus({ message: "Вход выполнен успешно", type: "success" });
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setLoginResult(`Error: ${error.message}`);
      setStatus({ message: error.message || "Ошибка входа", type: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  }

  async function fetchCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Нет активной сессии");
      }
      setMeResult(pretty(data.user));
    } catch {
      setMeResult(pretty({ message: "Пользователь не авторизован" }));
    }
  }

  async function logoutUser() {
    setLoading((prev) => ({ ...prev, logout: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка выхода");
      }

      setLoginResult(pretty({ message: "Сессия завершена" }));
      setMeResult(pretty({ message: "Пользователь не авторизован" }));
      setStatus({ message: "Вы вышли из аккаунта", type: "success" });
    } catch (error) {
      setStatus({ message: error.message || "Ошибка выхода", type: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, logout: false }));
    }
  }

  const statusClass = status.type ? `status-message ${status.type}` : "status-message";
  const templates = [
    { id: "classic", title: "Классический", description: "Строгий стиль для формальных вакансий." },
    { id: "modern", title: "Современный", description: "Аккуратный макет с визуальными акцентами." },
    { id: "creative", title: "Креативный", description: "Яркий дизайн для творческих направлений." },
    { id: "professional", title: "Профессиональный", description: "Деловой шаблон с расширенными блоками." },
  ];

  return (
    <div className="container">
      <header>
        <h1>ConResEd</h1>
        <p className="subtitle">Конвертер и редактор резюме</p>
      </header>

      <div className={statusClass}>{status.message}</div>

      <section className="demo-section">
        <h2>Выбор шаблона резюме</h2>
        <div className="template-grid">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => {
                window.location.href = `${TEMPLATE_BASE_URL}/${template.id}.html`;
              }}
            >
              <strong>{template.title}</strong>
              <span>{template.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="demo-section">
        <h2>Регистрация</h2>
        <form className="form-grid" onSubmit={registerUser}>
          <label htmlFor="full-name">ФИО</label>
          <input
            id="full-name"
            type="text"
            required
            minLength={2}
            value={registerForm.fullName}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={registerForm.email}
            onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
          />

          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={registerForm.password}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />

          <button className="btn btn-success" type="submit" disabled={loading.register}>
            {loading.register ? "Регистрируем..." : "Зарегистрироваться"}
          </button>
        </form>
        {registerResult && <div className="result-box">{registerResult}</div>}
      </section>

      <section className="demo-section">
        <h2>Вход</h2>
        <form className="form-grid" onSubmit={loginUser}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            required
            value={loginForm.email}
            onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
          />

          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            required
            minLength={8}
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />

          <button className="btn btn-primary" type="submit" disabled={loading.login}>
            {loading.login ? "Входим..." : "Войти"}
          </button>
        </form>
        {loginResult && <div className="result-box">{loginResult}</div>}
      </section>

      <section className="demo-section">
        <h2>Текущая сессия</h2>
        <button className="btn btn-danger" onClick={logoutUser} disabled={loading.logout}>
          {loading.logout ? "Выходим..." : "Выйти"}
        </button>
        {meResult && <div className="result-box">{meResult}</div>}
      </section>
    </div>
  );
}
