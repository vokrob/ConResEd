import { useState, useEffect } from "react";
import "./SaveModal.css";

export default function SaveModal({ isOpen, onClose, onSave, initialTitle = "", isCopyMode = false }) {
    const [title, setTitle] = useState(initialTitle);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setError("");
        }
    }, [isOpen, initialTitle]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) {
            setError("Введите название резюме");
            return;
        }
        onSave(trimmed, isCopyMode);
    };

    return (
        <div className="save-modal-overlay" onClick={onClose}>
            <div className="save-modal" onClick={(e) => e.stopPropagation()}>
                <div className="save-modal-header">
                    <h3>{isCopyMode ? "Сохранить как копию" : "Сохранить резюме"}</h3>
                    <button className="save-modal-close" onClick={onClose} title="Закрыть">×</button>
                </div>
                <form onSubmit={handleSubmit} className="save-modal-form">
                    <label htmlFor="resume-title">Название</label>
                    <input
                        id="resume-title"
                        type="text"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setError(""); }}
                        placeholder="Мое резюме"
                        maxLength={100}
                        autoFocus
                    />
                    {error && <span className="save-modal-error">{error}</span>}
                    <div className="save-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-success">
                            {isCopyMode ? "Сохранить копию" : "Сохранить"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}