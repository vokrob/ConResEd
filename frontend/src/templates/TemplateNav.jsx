import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "./TemplateNav.css";

const IDS = ["classic", "modern", "creative", "professional", "it"];
const LABELS = {
  classic: "Классический",
  modern: "Современный",
  creative: "Креативный",
  professional: "Профессиональный",
  it: "IT Специалист",
};

export function TemplateNav({
  extraActions = null,
  onNavigateHome = null,
  onSave = null,
  onClear = null,
  onSaveCopy = null,
  onExportPdf = null,
  hasResumeId = false,
  readOnly = false,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

  useEffect(() => {
    document.body.classList.add("has-sidebar-nav");
    return () => {
      document.body.classList.remove("has-sidebar-nav");
      document.body.classList.remove("sidebar-nav-collapsed");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-nav-collapsed", collapsed);
  }, [collapsed]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onNavigateHome) onNavigateHome();
    else navigate("/");
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
              {IDS.map((id) => {
                  const resumeId = searchParams.get("resumeId");
                  const targetUrl = resumeId ? `/templates/${id}?resumeId=${resumeId}` : `/templates/${id}`;

                  return (
                      <Link
                          key={id}
                          to={targetUrl}
                          className={`sidebar-nav-link ${location.pathname.includes(id) ? "active" : ""}`}
                          data-variant={id}
                      >
                          <span className="link-text">{LABELS[id]}</span>
                      </Link>
                  );
              })}
          </div>

          {!readOnly && (
              <div className="sidebar-nav-actions">
                  {extraActions}
                  <button type="button" className="btn btn-success" onClick={onSave}>
                      {hasResumeId ? "💾 Сохранить" : "📥 Сохранить"}
                  </button>
                  {hasResumeId && onSaveCopy && (
                      <button type="button" className="btn btn-primary" onClick={onSaveCopy}>
                          📄 Копия
                      </button>
                  )}
                  <button type="button" className="btn btn-primary" onClick={onExportPdf}>
                      🖨️ PDF
                  </button>
                  <button type="button" className="btn btn-danger" onClick={onClear}>
                      🗑️ Очистить
                  </button>
              </div>
          )}
    </nav>
  );
}