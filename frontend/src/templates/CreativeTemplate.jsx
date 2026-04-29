import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildKeyList } from "./resumeNormalize.js";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
import { ShareQrFooter } from "./ShareQrFooter.jsx";
import { PhotoUploader } from "../components/PhotoUploader.jsx";
import { ResumeUploader } from "./ResumeUploader.jsx";
import SaveModal from "./SaveModal.jsx";
import {
  creativeDescriptors,
  creativeExpBase,
  remapCreativeRemoveEducationRow,
  remapCreativeRemoveExperienceRow,
  remapCreativeRemoveSkill,
} from "./creativeDescriptors.js";
import { useResumeTemplateController } from "./useResumeTemplateController.js";
import "./styles/creative.css";

const COUNTS_KEY = "resume-counts-creative";

export default function CreativeTemplate() {
  const navigate = useNavigate();
  const ctrl = useResumeTemplateController({ templateId: "creative" });
  const saved = JSON.parse(localStorage.getItem(COUNTS_KEY) || "null");
  const [skillCount, setSkillCount] = useState(saved?.skills || 4);

  useEffect(() => {
    if (ctrl.parseCounts && typeof ctrl.parseCounts.skills === "number") {
      setSkillCount(Math.max(1, ctrl.parseCounts.skills));
    }
  }, [ctrl.parseCounts]);

  useEffect(() => {
    localStorage.setItem(COUNTS_KEY, JSON.stringify({ skills: skillCount }));
  }, [skillCount]);

  const {
    fieldValues,
    setField,
    replaceFieldValues,
    experienceCount,
    setExperienceCount,
    educationCount,
    setEducationCount,
    clearAllFields: clearCtrl,
    saveToCabinet,
    ready,
    readOnly,
    embed,
    publicUrl,
    photo,
    setPhoto,
    uploadResumeFile,
    resetParsedFields,
    isParsingResume,
    parseWarnings,
    parseError,
    hasParsedData,
    resumeId,
    currentTitle,
  } = ctrl;

  const descriptors = useMemo(
    () => creativeDescriptors(experienceCount, educationCount, skillCount),
    [experienceCount, educationCount, skillCount],
  );
  const keys = useMemo(() => buildKeyList(descriptors), [descriptors]);

  const headerKeys = keys.slice(0, 8);
  const contactKeys = keys.slice(8, 13);
  const skillsBase = 13;
  const skillKeys = keys.slice(skillsBase, skillsBase + skillCount);
  const leftEmptyKey = keys[skillsBase + skillCount];
  const aboutKey = keys[skillsBase + skillCount + 1];
  const expBase = creativeExpBase(skillCount);
  const eduBase = expBase + experienceCount * 4;

  const addExperience = () => setExperienceCount((n) => n + 1);
  const removeExperienceAt = (rowIndex) => {
    if (experienceCount <= 1) return;
    const next = remapCreativeRemoveExperienceRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      skillCount,
    );
    replaceFieldValues(next);
    setExperienceCount((n) => n - 1);
  };

  const addEducation = () => setEducationCount((n) => n + 1);
  const removeEducationAt = (rowIndex) => {
    if (educationCount <= 1) return;
    const next = remapCreativeRemoveEducationRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      skillCount,
    );
    replaceFieldValues(next);
    setEducationCount((n) => n - 1);
  };

  const addSkill = () => setSkillCount((n) => n + 1);
  const removeSkillAt = (rowIndex) => {
    if (skillCount <= 1) return;
    const next = remapCreativeRemoveSkill(
      fieldValues,
      experienceCount,
      educationCount,
      skillCount,
    );
    replaceFieldValues(next);
    setSkillCount((n) => n - 1);
  };

  const clearAll = useCallback(() => {
    clearCtrl();
    setSkillCount(4);
    localStorage.removeItem(COUNTS_KEY);
  }, [clearCtrl]);

  const handleNavigateHome = useCallback(() => {
    clearCtrl();
    setSkillCount(4);
    navigate("/");
  }, [clearCtrl, navigate]);

  const structure = { experience: experienceCount, education: educationCount };
  const [saveStatus, setSaveStatus] = useState({ message: "", visible: false, type: "success" });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveMode, setSaveMode] = useState("save");

  useEffect(() => {
      if (saveStatus.visible) {
          const timer = setTimeout(() => setSaveStatus((prev) => ({ ...prev, visible: false })), 3000);
          return () => clearTimeout(timer);
      }
  }, [saveStatus.visible]);

  const openSaveModal = (mode) => { setSaveMode(mode); setIsSaveModalOpen(true); };

  const handleSaveConfirm = async (title) => {
      const isCopy = saveMode === "copy";
      const result = await saveToCabinet("creative", keys, structure, title, isCopy);
      if (result?.ok) setSaveStatus({ message: result.message, visible: true, type: "success" });
      else setSaveStatus({ message: result.message || "Ошибка сохранения", visible: true, type: "error" });
      setIsSaveModalOpen(false);
  };

  const handleSave = () => openSaveModal("save");
  const handleSaveCopy = () => openSaveModal("copy");
  const handleClear = () => { clearAll(); };
  const handlePdf = () => { window.print(); };

    if (!ready) {
        return (
            <div className="template-loader">
                <div className="loading-spinner" />
                <span>Загрузка резюме…</span>
            </div>
        );
    }

  const navExtra = !readOnly ? (
      <ResumeUploader onUpload={uploadResumeFile} onResetParsed={resetParsedFields} isLoading={isParsingResume} warnings={parseWarnings} error={parseError} hasParsedData={hasParsedData} />
  ) : null;

    return (
        <div className="creative-template-page">
            {!embed && (
              <TemplateNav
                  extraActions={navExtra}
                  onNavigateHome={handleNavigateHome}
                  onSave={handleSave}
                  onSaveCopy={handleSaveCopy}
                  onClear={handleClear}
                  onExportPdf={handlePdf}
                  hasResumeId={!!resumeId}
                  readOnly={readOnly}
                />
            )}
            <div className="resume-container">
        <header className="header print-priority-high">
          <div className="header-content">
            {!readOnly && (
              <PhotoUploader onPhotoSelect={setPhoto} currentPhoto={photo} />
            )}
            {readOnly && photo && (
              <div className="avatar-placeholder">
                <img src={photo} alt="Фото" />
              </div>
            )}
            {readOnly && !photo && (
              <div className="avatar-placeholder">📷 Фото</div>
            )}
            <div>
              <div className="name-wrapper">
                <div className="name">
                  <EditableField
                    fio
                    fieldKey={headerKeys[0]}
                    value={fieldValues[headerKeys[0]]}
                    onChange={setField}
                    placeholder="Фамилия"
                  />
                  <EditableField
                    fio
                    fieldKey={headerKeys[1]}
                    value={fieldValues[headerKeys[1]]}
                    onChange={setField}
                    placeholder="Имя"
                  />
                  <EditableField
                    fio
                    fieldKey={headerKeys[2]}
                    value={fieldValues[headerKeys[2]]}
                    onChange={setField}
                    placeholder="Отчество"
                  />
                </div>
                <div className="title">
                  <EditableField
                    fieldKey={headerKeys[3]}
                    value={fieldValues[headerKeys[3]]}
                    onChange={setField}
                    placeholder="Должность"
                  />
                </div>
                <div className="tagline">
                  <EditableField
                    fieldKey={headerKeys[4]}
                    value={fieldValues[headerKeys[4]]}
                    onChange={setField}
                    placeholder="Ваш слоган или краткое описание"
                  />
                </div>
              </div>
              <div className="stats-row">
                <div className="stat-item">
                  <div className="stat-label">Лет опыта</div>
                  <div className="stat-number">
                    <EditableField fieldKey={headerKeys[5]} value={fieldValues[headerKeys[5]]} onChange={setField} placeholder="" />
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Проектов</div>
                  <div className="stat-number">
                    <EditableField fieldKey={headerKeys[6]} value={fieldValues[headerKeys[6]]} onChange={setField} placeholder="" />
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Клиентов</div>
                  <div className="stat-number">
                    <EditableField fieldKey={headerKeys[7]} value={fieldValues[headerKeys[7]]} onChange={setField} placeholder="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="content one-column">
          <div className="section print-priority-high">
            <h2 className="section-title">Связаться</h2>
            <div className="contact-list">
              {[
                { icon: "@", ph: "Email" },
                { icon: "📱", ph: "Телефон" },
                { icon: "🌐", ph: "Сайт" },
                { icon: "in", ph: "hh.ru" },
                { icon: "📍", ph: "Локация" },
              ].map((c, i) => (
                <div key={c.ph} className="contact-item">
                  <div className="contact-icon">{c.icon}</div>
                  <EditableField
                    fieldKey={contactKeys[i]}
                    value={fieldValues[contactKeys[i]]}
                    onChange={setField}
                    placeholder={c.ph}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="section print-priority-high">
            <h2 className="section-title">О себе</h2>
            <div className="highlight-box">
              <EditableField
                fieldKey={aboutKey}
                value={fieldValues[aboutKey]}
                onChange={setField}
                placeholder="Расскажите свою историю"
              />
            </div>
          </div>

          <div className="section print-priority-medium">
            <h2 className="section-title">Опыт</h2>
            <div id="experience-container">
              {Array.from({ length: experienceCount }).map((_, row) => {
                const base = expBase + row * 4;
                const rk = keys.slice(base, base + 4);
                return (
                  <div key={`exp-${row}`} className="experience-item">
                    <div className="item-header">
                      <span className="item-title">
                        <EditableField
                          fieldKey={rk[0]}
                          value={fieldValues[rk[0]]}
                          onChange={setField}
                          placeholder="Должность"
                        />
                      </span>
                      <span className="item-date">
                        <EditableField fieldKey={rk[1]} value={fieldValues[rk[1]]} onChange={setField} placeholder="Период" />
                      </span>
                    </div>
                    <div className="item-company">
                      <EditableField fieldKey={rk[2]} value={fieldValues[rk[2]]} onChange={setField} placeholder="Компания" />
                    </div>
                    <div className="item-description">
                      <EditableField fieldKey={rk[3]} value={fieldValues[rk[3]]} onChange={setField} placeholder="Описание" />
                    </div>
                    {!readOnly && (
                      <button type="button" className="item-remove-btn" onClick={() => removeExperienceAt(row)}>
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <div className="experience-controls">
                <button type="button" className="btn-add" onClick={addExperience}>+</button>
              </div>
            )}
          </div>

          <div className="section print-priority-medium">
            <h2 className="section-title">Образование</h2>
            <div id="education-container">
              {Array.from({ length: educationCount }).map((_, row) => {
                const base = eduBase + row * 3;
                const rk = keys.slice(base, base + 3);
                return (
                  <div key={`edu-${row}`} className="experience-item">
                    <div className="item-header">
                      <span className="item-title">
                        <EditableField fieldKey={rk[0]} value={fieldValues[rk[0]]} onChange={setField} placeholder="Степень" />
                      </span>
                      <span className="item-date">
                        <EditableField fieldKey={rk[1]} value={fieldValues[rk[1]]} onChange={setField} placeholder="Год" />
                      </span>
                    </div>
                    <div className="item-company">
                      <EditableField
                        fieldKey={rk[2]}
                        value={fieldValues[rk[2]]}
                        onChange={setField}
                        placeholder="Учебное заведение"
                      />
                    </div>
                    {!readOnly && (
                      <button type="button" className="item-remove-btn" onClick={() => removeEducationAt(row)}>
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <div className="experience-controls">
                <button type="button" className="btn-add" onClick={addEducation}>+</button>
              </div>
            )}
          </div>

          <div className="section print-priority-medium">
            <h2 className="section-title">Навыки</h2>
            <div id="skills-container" className="skills-grid">
              {skillKeys.map((sk, idx) => (
                <div key={sk} className="skill-item" style={{ position: "relative" }}>
                  <EditableField fieldKey={sk} value={fieldValues[sk]} onChange={setField} placeholder="Навык" />
                  {!readOnly && (
                    <button
                      type="button"
                      className="item-remove-btn"
                      onClick={() => removeSkillAt(idx)}
                      disabled={skillCount <= 1}
                      style={{ position: "absolute", top: "4px", right: "4px", margin: 0 }}
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="experience-controls">
                <button type="button" className="btn-add" onClick={addSkill}>+</button>
              </div>
            )}
          </div>

          <div className="section print-priority-low">
            <h2 className="section-title">Дополнительно</h2>
            <div className="highlight-box">
              <EditableField fieldKey={leftEmptyKey} value={fieldValues[leftEmptyKey]} onChange={setField} placeholder="" />
            </div>
          </div>
        </div>
      </div>
            {!embed && readOnly && <ShareQrFooter publicUrl={publicUrl} />}
            {saveStatus.visible && (
                <div className={`save-toast ${saveStatus.type === "error" ? "error" : ""}`}>
                    {saveStatus.type === "error" ? "❌ " : "✅ "}
                    {saveStatus.message}
                </div>
            )}

            <SaveModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveConfirm}
                initialTitle={(() => {
                    if (currentTitle?.trim()) {
                        if (saveMode === 'copy') return `${currentTitle.trim()} (копия)`;
                        return currentTitle.trim();
                    }
                    return `Резюме ${new Date().toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}`;
                })()}
                isCopyMode={saveMode === "copy"}
            />
    </div>
  );
}