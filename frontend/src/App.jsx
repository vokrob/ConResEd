import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";

import PublicResume from "./PublicResume";

const API_BASE_URL = "/api";
const TEMPLATE_BASE_URL = "/templates";

function userInitials(user) {
  const name = (user.full_name || user.email || "?").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

function Home() {
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState({
    register: false,
    login: false,
    logout: false,
    session: true,
  });

  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");

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

      setStatus({ message: "Регистрация выполнена успешно. Войдите в аккаунт.", type: "success" });
      setLoginForm((prev) => ({ ...prev, email }));
      setRegisterForm({ fullName: "", email: "", password: "" });
      setAuthMode("login");
    } catch (error) {
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

      setUser(data.user);
      setStatus({ message: "Вход выполнен успешно", type: "success" });
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setStatus({ message: error.message || "Ошибка входа", type: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  }

  async function fetchCurrentUser() {
    setLoading((prev) => ({ ...prev, session: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setUser(null);
        return;
      }
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
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

      setUser(null);
      setAuthMode("login");
      setStatus({ message: "Вы вышли из аккаунта", type: "success" });
    } catch (error) {
      setStatus({ message: error.message || "Ошибка выхода", type: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, logout: false }));
    }
  }

  const statusClass = status.type ? `status-message ${status.type}` : "status-message";

  const templates = [
    {
      id: "classic",
      variant: "classic",
      title: "Классический",
      description: "Строгий стиль для формальных вакансий.",
    },
    {
      id: "modern",
      variant: "modern",
      title: "Современный",
      description: "Аккуратный макет с визуальными акцентами.",
    },
    {
      id: "creative",
      variant: "creative",
      title: "Креативный",
      description: "Яркий дизайн для творческих направлений.",
    },
    {
      id: "professional",
      variant: "professional",
      title: "Профессиональный",
      description: "Деловой шаблон с расширенными блоками.",
    },
  ];

  if (loading.session) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <header className="auth-brand">
            <h1>ConResEd</h1>
            <p className="subtitle">Конвертер и редактор резюме</p>
          </header>
          <div className="auth-card">
            <div className="session-loading">
              <div className="loading-spinner" role="status" aria-label="Загрузка" />
              <span>Загрузка…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <header className="auth-brand">
            <h1>ConResEd</h1>
            <p className="subtitle">Конвертер и редактор резюме</p>
          </header>

          <div className="auth-card">
            <div className={statusClass}>{status.message}</div>

            {authMode === "login" ? (
              <section className="auth-section">
                <h2 className="auth-heading">Вход</h2>
                <form className="form-grid" onSubmit={loginUser}>
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  />

                  <label htmlFor="login-password">Пароль</label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />

                  <button className="btn btn-primary btn-block" type="submit" disabled={loading.login}>
                    {loading.login ? "Входим…" : "Войти"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="auth-section">
                <h2 className="auth-heading">Регистрация</h2>
                <form className="form-grid" onSubmit={registerUser}>
                  <label htmlFor="full-name">ФИО</label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
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
                    autoComplete="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  />

                  <label htmlFor="password">Пароль</label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />

                  <button className="btn btn-success btn-block" type="submit" disabled={loading.register}>
                    {loading.register ? "Регистрируем…" : "Зарегистрироваться"}
                  </button>
                </form>
              </section>
            )}
          </div>

          <footer className="auth-footer">
            {authMode === "login" ? (
              <button type="button" className="auth-footer-link" onClick={() => setAuthMode("register")}>
                Нет аккаунта? Зарегистрироваться
              </button>
            ) : (
              <button type="button" className="auth-footer-link" onClick={() => setAuthMode("login")}>
                Уже есть аккаунт? Войти
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="app-header-bar">
        <div>
          <h1>ConResEd</h1>
          <p className="subtitle">Выбор шаблона резюме</p>
        </div>
        <div className="user-bar">
          <div className="user-pill" title={user.email}>
            <span className="user-avatar" aria-hidden="true">
              {userInitials(user)}
            </span>
            <span className="user-email">{user.full_name || user.email}</span>
          </div>
          <button className="btn btn-danger btn-compact" onClick={logoutUser} disabled={loading.logout}>
            {loading.logout ? "Выход…" : "Выйти"}
          </button>
        </div>
      </header>

      <div className={statusClass}>{status.message}</div>

      <section className="demo-section template-section">
        <h2>Шаблоны резюме</h2>
        <div className="template-grid">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-card"
              data-variant={template.variant}
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
    </div>
  );
}

function PublicResumeRoute() {
  const params = useParams();
  return <PublicResume publicId={params.publicId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:publicId" element={<PublicResumeRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
