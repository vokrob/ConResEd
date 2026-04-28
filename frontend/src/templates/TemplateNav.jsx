import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./TemplateNav.css";

const IDS = ["classic", "modern", "creative", "professional", "it"];
const LABELS = {
  classic: "Классический",
  modern: "Современный",
  creative: "Креативный",
  professional: "Профессиональный",
  it: "IT Специалист",
};

export function TemplateNav({ extraActions = null }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  useEffect(() => {
    document.body.classList.add("has-sidebar-nav");
    return () => document.body.classList.remove("has-sidebar-nav");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-nav-collapsed", collapsed);
  }, [collapsed]);

  return (
    <nav className={`template-sidebar-nav ${collapsed ? "collapsed" : ""}`}>
      <button
        className="sidebar-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Развернуть меню" : "Свернуть меню"}
      >
        {collapsed ? "▶" : "◀"}
      </button>
          <Link to="/" className={`sidebar-nav-link home-link ${location.pathname === "/" ? "active" : ""}`}>
              <span className="link-text">Главная</span>
      </Link>
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