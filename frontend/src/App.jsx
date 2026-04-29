import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "/api";

function userInitials(user) {
    if (!user) return "??";
    const name = (user.full_name || user.email || "?").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
}

function buildOwnerReadonlyTemplatePath(item) {
    const url = new URL(`/templates/${item.template_id}`, window.location.origin);
    url.searchParams.set("readonly", "1");
    url.searchParams.set("resumeId", String(item.id));
    return `${url.pathname}${url.search}`;
}

export default function App() {
    const navigate = useNavigate();
    const [status, setStatus] = useState({ message: "", type: "" });
    const [loading, setLoading] = useState({
        register: false,
        login: false,
        logout: false,
        session: true,
    });
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState("login");
    const [savedResumes, setSavedResumes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
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
        const timer = setTimeout(() => setStatus((prev) => ({ ...prev, type: "" })), 5000);
        return () => clearTimeout(timer);
    }, [status.message]);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (user) fetchSavedResumes();
        else setSavedResumes([]);
    }, [user]);

    async function registerUser(event) {
        event.preventDefault();
        const { fullName, email, password } = registerForm;
        if (!fullName.trim() || !email.trim() || !password) {
            setStatus({ message: "Заполните все поля регистрации", type: "error" });
            return;
        }
        setLoading((prev) => ({ ...prev, register: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName.trim(), email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
            setStatus({ message: "Регистрация успешна. Войдите в аккаунт.", type: "success" });
            setLoginForm((prev) => ({ ...prev, email: email.trim() }));
            setRegisterForm({ fullName: "", email: "", password: "" });
            setAuthMode("login");
        } catch (err) {
            setStatus({ message: err.message, type: "error" });
        } finally {
            setLoading((prev) => ({ ...prev, register: false }));
        }
    }

    async function loginUser(event) {
        event.preventDefault();
        const { email, password } = loginForm;
        if (!email.trim() || !password) {
            setStatus({ message: "Введите email и пароль", type: "error" });
            return;
        }
        setLoading((prev) => ({ ...prev, login: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка входа");
            setUser(data.user);
            setStatus({ message: "Вход выполнен успешно", type: "success" });
            setLoginForm({ email: "", password: "" });
        } catch (err) {
            setStatus({ message: err.message, type: "error" });
        } finally {
            setLoading((prev) => ({ ...prev, login: false }));
        }
    }

    async function fetchCurrentUser() {
        setLoading((prev) => ({ ...prev, session: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
            const data = await res.json();
            if (!res.ok || !data.user) {
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
            const res = await fetch(`${API_BASE_URL}/logout`, { method: "POST", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка выхода");
            setUser(null);
            setAuthMode("login");
            setStatus({ message: "Вы вышли из аккаунта", type: "success" });
        } catch (err) {
            setStatus({ message: err.message, type: "error" });
        } finally {
            setLoading((prev) => ({ ...prev, logout: false }));
        }
    }

    async function fetchSavedResumes() {
        try {
            const res = await fetch(`${API_BASE_URL}/resumes`, { credentials: "include" });
            const data = await res.json();
            if (!res.ok) return;
            const items = Array.isArray(data.items) ? data.items : [];
            setSavedResumes(items.map((i) => ({ ...i, is_favorite: !!i.is_favorite })));
        } catch {
            setSavedResumes([]);
        }
    }

    async function deleteSavedResume(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/resumes/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (res.ok) {
                setSavedResumes((prev) => prev.filter((i) => i.id !== id));
                setStatus({ message: "Резюме удалено", type: "success" });
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus({ message: data.error || "Не удалось удалить", type: "error" });
            }
        } catch {
            setStatus({ message: "Ошибка сети", type: "error" });
        }
    }

    async function toggleFavorite(id) {
        setSavedResumes((prev) =>
            prev.map((item) => (item.id === id ? { ...item, is_favorite: !item.is_favorite } : item))
        );
    }

    const statusClass = status.type ? `status-message ${status.type}` : "status-message";

    const templates = [
        { id: "classic", variant: "classic", title: "Классический", description: "Строгий стиль для формальных вакансий." },
        { id: "modern", variant: "modern", title: "Современный", description: "Аккуратный макет с визуальными акцентами." },
        { id: "creative", variant: "creative", title: "Креативный", description: "Яркий дизайн для творческих направлений." },
        { id: "professional", variant: "professional", title: "Профессиональный", description: "Деловой шаблон с расширенными блоками." },
        { id: "it", variant: "it", title: "IT Специалист", description: "Для разработчиков, DevOps, аналитиков. Технологии, проекты, сертификаты." },
    ];

    const filteredAndSortedResumes = savedResumes
        .filter((item) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (item.title || "").toLowerCase().includes(q) || (item.template_id || "").toLowerCase().includes(q);
        })
        .sort((a, b) => {
            if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
            const getTs = (val) => {
                if (!val) return 0;
                const t = new Date(val).getTime();
                return isNaN(t) ? 0 : t;
            };
            const tA = getTs(a.updated_at || a.created_at || a.updatedAt || a.createdAt);
            const tB = getTs(b.updated_at || b.created_at || b.updatedAt || b.createdAt);
            return sortOrder === "newest" ? tB - tA : tA - tB;
        });

    if (loading.session) {
        return (
            <div className="auth-page">
                <div className="auth-panel">
                    <div className="auth-brand"><h1>ConResEd</h1><p className="subtitle">Конвертер и редактор резюме</p></div>
                    <div className="session-loading"><div className="loading-spinner"></div><span>Загрузка…</span></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="auth-page">
                <div className="auth-panel">
                    <div className="auth-brand"><h1>ConResEd</h1><p className="subtitle">Конвертер и редактор резюме</p></div>
                    <div className="auth-card">
                        <div className={statusClass}>{status.message}</div>
                        {authMode === "login" ? (
                            <section className="auth-section">
                                <h2 className="auth-heading">Вход</h2>
                                <form className="form-grid" onSubmit={loginUser}>
                                    <label htmlFor="login-email">Email</label>
                                    <input id="login-email" type="email" required autoComplete="email" value={loginForm.email} onChange={(e) => setLoginForm(p => ({ ...p, email: e.target.value }))} />
                                    <label htmlFor="login-password">Пароль</label>
                                    <input id="login-password" type="password" required minLength={8} autoComplete="current-password" value={loginForm.password} onChange={(e) => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                                    <button className="btn btn-primary btn-block" type="submit" disabled={loading.login}>{loading.login ? "Входим…" : "Войти"}</button>
                                </form>
                            </section>
                        ) : (
                            <section className="auth-section">
                                <h2 className="auth-heading">Регистрация</h2>
                                <form className="form-grid" onSubmit={registerUser}>
                                    <label htmlFor="full-name">ФИО</label>
                                    <input id="full-name" type="text" required minLength={2} autoComplete="name" value={registerForm.fullName} onChange={(e) => setRegisterForm(p => ({ ...p, fullName: e.target.value }))} />
                                    <label htmlFor="email">Email</label>
                                    <input id="email" type="email" required autoComplete="email" value={registerForm.email} onChange={(e) => setRegisterForm(p => ({ ...p, email: e.target.value }))} />
                                    <label htmlFor="password">Пароль</label>
                                    <input id="password" type="password" required minLength={8} autoComplete="new-password" value={registerForm.password} onChange={(e) => setRegisterForm(p => ({ ...p, password: e.target.value }))} />
                                    <button className="btn btn-success btn-block" type="submit" disabled={loading.register}>{loading.register ? "Регистрируем…" : "Зарегистрироваться"}</button>
                                </form>
                            </section>
                        )}
                    </div>
                    <footer className="auth-footer">
                        {authMode === "login" ? (
                            <button type="button" className="auth-footer-link" onClick={() => setAuthMode("register")}>Нет аккаунта? Зарегистрироваться</button>
                        ) : (
                            <button type="button" className="auth-footer-link" onClick={() => setAuthMode("login")}>Уже есть аккаунт? Войти</button>
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
                    <div className="user-pill" title={user?.email || ""}>
                        <div className="user-avatar">{userInitials(user)}</div>
                        <span className="user-email">{user?.full_name || user?.email || "Пользователь"}</span>
                    </div>
                    <button className="btn btn-danger btn-compact" onClick={logoutUser} disabled={loading.logout}>
                        {loading.logout ? "Выход…" : "Выйти"}
                    </button>
                </div>
            </header>
            <div className={statusClass}>{status.message}</div>

            <div className="dashboard-grid">

                <section className="demo-section template-section">
                    <h2>Сохраненные шаблоны</h2>
                    <div className="resume-controls">
                        <div className="search-box">
                            <input type="text" placeholder="🔍 Поиск по названию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                            {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")} title="Очистить поиск">✕</button>}
                        </div>
                        <div className="sort-box">
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="sort-select">
                                <option value="newest">⌚ Сначала новые</option>
                                <option value="oldest">⌚ Сначала старые</option>
                            </select>
                        </div>
                    </div>
                    <div className="template-list" role="list">
                        {filteredAndSortedResumes.length === 0 ? (
                            <div className="template-row" role="listitem">
                                <div className="template-row-content">
                                    <strong>{savedResumes.length === 0 ? "Пока нет сохраненных шаблонов" : "Ничего не найдено"}</strong>
                                    <span>{savedResumes.length === 0 ? "Откройте шаблон, заполните и нажмите \"Сохранить в личный кабинет\"." : "Попробуйте изменить поисковый запрос"}</span>
                                </div>
                            </div>
                        ) : (
                            filteredAndSortedResumes.map((item) => (
                                <div key={item.id} className="template-row" role="listitem">
                                    <button
                                        type="button"
                                        className={`favorite-btn ${item.is_favorite ? "is-favorite" : ""}`}
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                        title={item.is_favorite ? "Убрать из избранного" : "В избранное"}
                                    >
                                        {item.is_favorite ? "★" : "☆"}
                                    </button>

                                    <button type="button" className="template-open-btn" onClick={() => navigate(`/templates/${item.template_id}?resumeId=${item.id}`)}>
                                        <div className="template-row-content">
                                            <strong>{item.title}</strong>
                                            <span className="saved-date">
                                                {(() => {
                                                    const raw = item.updated_at || item.updatedAt || item.created_at || item.createdAt;
                                                    const d = raw ? new Date(raw) : null;
                                                    if (!d || isNaN(d.getTime())) return 'Нет даты';
                                                    return d.toLocaleString('ru-RU', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                    });
                                                })()}
                                            </span>
                                        </div>
                                        <span className="template-row-action" aria-hidden="true">Открыть</span>
                                    </button>

                                    <div className="resume-actions">
                                        <button type="button" className="btn btn-primary btn-compact" onClick={() => navigate(buildOwnerReadonlyTemplatePath(item))} title="Режим просмотра">Просмотр</button>
                                        <button type="button" className="btn btn-danger btn-compact" onClick={() => deleteSavedResume(item.id)}>Удалить</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="demo-section template-section">
                    <h2>Шаблоны резюме</h2>
                    <div className="template-list" role="list">
                        {templates.map((t) => (
                            <button key={t.id} type="button" className="template-row" data-variant={t.variant} role="listitem" onClick={() => navigate(`/templates/${t.id}?blank=1`)}>
                                <div className="template-row-content">
                                    <strong>{t.title}</strong>
                                    <span>{t.description}</span>
                                </div>
                                <span className="template-row-action" aria-hidden="true">Открыть</span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}