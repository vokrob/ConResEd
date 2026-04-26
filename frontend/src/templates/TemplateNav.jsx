import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import "./TemplateNav.css";
import SaveModal from "./SaveModal.jsx";

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
    onResumeSave = null,
    onResumeCopy = null,
    currentResumeId = null,
    currentTitle = ""
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveMode, setSaveMode] = useState("save");
    const location = useLocation();

    useEffect(() => {
        document.body.classList.add("has-sidebar-nav");
        return () => document.body.classList.remove("has-sidebar-nav");
    }, []);

    useEffect(() => {
        document.body.classList.toggle("sidebar-nav-collapsed", collapsed);
    }, [collapsed]);

    const openSaveModal = useCallback((mode) => {
        setSaveMode(mode);
        setIsSaveModalOpen(true);
    }, []);

    const handleSaveConfirm = useCallback((title, isCopy) => {
        if (isCopy && onResumeCopy) {
            onResumeCopy(title);
        } else if (!isCopy && onResumeSave) {
            onResumeSave(title);
        }
        setIsSaveModalOpen(false);
    }, [onResumeSave, onResumeCopy]);

    return (
        <>
            <nav className={`template-sidebar-nav ${collapsed ? "collapsed" : ""}`}>
                {/* 🔼 Кнопка сворачивания (Фиксирована сверху) */}
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? "Развернуть меню" : "Свернуть меню"}
                >
                    {collapsed ? "▶" : "◀"}
                </button>

                {/* 🔗 Фиксированная кнопка "Главная" (не скроллится) */}
                <Link
                    to="/"
                    className={`sidebar-nav-link home-link ${location.pathname === "/" ? "active" : ""}`}
                >
                    <span className="link-text">Главная</span>
                </Link>

                {/* 📜 Скроллируемый блок шаблонов */}
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

                {/* 🔽 Кнопки действий (Фиксированы внизу) */}
                <div className="sidebar-nav-actions">
                    {/* Кнопка "Сохранить" или "Сохранить изменения" */}
                    {!location.pathname.includes("readonly") && (
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => openSaveModal("save")}
                        >
                            {currentResumeId ? "💾 Сохранить изменения" : "📥 Сохранить в кабинет"}
                        </button>
                    )}

                    {/* Кнопка "Сохранить как копию" (видна только если есть сохранённое резюме) */}
                    {/*{!location.pathname.includes("readonly") && currentResumeId && (*/}
                    {/*    <button*/}
                    {/*        type="button"*/}
                    {/*        className="btn btn-primary"*/}
                    {/*        style={{ fontSize: "0.85rem", padding: "8px 12px" }}*/}
                    {/*        onClick={() => openSaveModal("copy")}*/}
                    {/*    >*/}
                    {/*        📄 Сохранить как копию*/}
                    {/*    </button>*/}
                    {/*)}*/}

                    {/* PDF и Очистить */}
                    {!location.pathname.includes("readonly") && (
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => {
                                if (window.confirm("Очистить все поля? Это действие нельзя отменить.")) {
                                    window.location.reload();
                                }
                            }}
                        >
                            🗑️ Очистить всё
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => window.print()}
                    >
                        🖨️ Скачать PDF
                    </button>
                </div>
            </nav>

            {/* Модальное окно сохранения */}
            <SaveModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveConfirm}
                initialTitle={currentTitle || `Мое резюме (${IDS.find(id => location.pathname.includes(id)) || "new"})`}
                isCopyMode={saveMode === "copy"}
            />
        </>
    );
}