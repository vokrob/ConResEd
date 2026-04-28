import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./TemplateNav.css";

const IDS = ["classic", "modern", "creative", "professional", "it"];
const LABELS = {
  classic: "Классический",
  modern: "Современный",
  creative: "Креативный",
  professional: "Профессиональный",
  it: "IT Специалист",
};

export function TemplateNav({ extraActions = null, onNavigateHome = null }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("has-sidebar-nav");
    return () => document.body.classList.remove("has-sidebar-nav");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-nav-collapsed", collapsed);
  }, [collapsed]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate("/");
    }
  };

  return (
    <nav className={`template-sidebar-nav ${collapsed ? "collapsed" : ""}`}>
      <button
        className="sidebar-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Развернуть меню" : "Свернуть меню"}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Главная: либо кнопка с очисткой, либо ссылка */}
      {onNavigateHome ? (
        <button
          type="button"
          className={`sidebar-nav-link home-link ${location.pathname === "/" ? "active" : ""}`}
          onClick={handleHomeClick}
        >
          <span className="link-text">Главная</span>
        </button>
      ) : (
        <Link
          to="/"
          className={`sidebar-nav-link home-link ${location.pathname === "/" ? "active" : ""}`}
        >
          <span className="link-text">Главная</span>
        </Link>
      )}

      <div className="sidebar-nav-scroll-area">
        {IDS.map((id) => (
          <Link
            key={id}
            to={`/templates/${id}`}
            className={`sidebar-nav-link ${location.pathname.includes(id) ? "active" : ""}`}
            data-variant={id}
          >
            <span className="link-text">{LABELS[id]}</span>
          </Link>
        ))}
      </div>

      {extraActions && <div className="sidebar-nav-actions">{extraActions}</div>}
    </nav>
  );
}