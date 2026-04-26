import { useCallback, useMemo, useState } from "react";
import { buildKeyList } from "./resumeNormalize.js";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
import { ShareQrFooter } from "./ShareQrFooter.jsx";
import { PhotoUploader } from "../components/PhotoUploader.jsx";
import {
  MODERN_PREFIX,
  modernDescriptors,
  modernSkillsBase,
  remapModernRemoveEducationRow,
  remapModernRemoveExperienceRow,
  remapModernRemoveLang,
  remapModernRemoveSkill,
} from "./modernDescriptors.js";
import { useResumeTemplateController } from "./useResumeTemplateController.js";
import "./styles/modern.css";

// Новая функция для удаления конкретного навыка по индексу
function remapModernRemoveSkillAt(fieldValues, exp, edu, skills, langs, removeIdx) {
  const oldD = modernDescriptors(exp, edu, skills, langs);
  const newD = modernDescriptors(exp, edu, skills - 1, langs);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = modernSkillsBase(exp, edu);
  const removePosition = base + removeIdx;
  const next = {};
  let ni = 0;
  for (let oi = 0; oi < oldK.length; oi++) {
    if (oi === removePosition) continue;
    const v = fieldValues[oldK[oi]];
    if (v) next[newK[ni]] = v;
    ni++;
  }
  return next;
}

// Новая функция для удаления конкретного языка по индексу
function remapModernRemoveLangAt(fieldValues, exp, edu, skills, oldLang, removeIdx) {
  const newLang = oldLang - 1;
  const oldD = modernDescriptors(exp, edu, skills, oldLang);
  const newD = modernDescriptors(exp, edu, skills, newLang);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = modernSkillsBase(exp, edu) + skills;
  const removeFirst = base + 2 * removeIdx;
  const next = {};
  let ni = 0;
  for (let oi = 0; oi < oldK.length; oi++) {
    if (oi === removeFirst || oi === removeFirst + 1) continue;
    const v = fieldValues[oldK[oi]];
    if (v) next[newK[ni]] = v;
    ni++;
  }
  return next;
}

export default function ModernTemplate() {
  const ctrl = useResumeTemplateController({ templateId: "modern" });
  const [skillCount, setSkillCount] = useState(4);
  const [langCount, setLangCount] = useState(1);

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
  } = ctrl;

  const descriptors = useMemo(
    () => modernDescriptors(experienceCount, educationCount, skillCount, langCount),
    [experienceCount, educationCount, skillCount, langCount],
  );
  const keys = useMemo(() => buildKeyList(descriptors), [descriptors]);

  const headerKeys = keys.slice(0, 4);
  const contactKeys = keys.slice(4, 8);
  const aboutKey = keys[8];
  const expBase = MODERN_PREFIX;
  const eduBase = expBase + experienceCount * 4;
  const skillsBase = modernSkillsBase(experienceCount, educationCount);
  const skillKeys = keys.slice(skillsBase, skillsBase + skillCount);
  const langKeys = keys.slice(skillsBase + skillCount, skillsBase + skillCount + langCount * 2);
  const interestsKey = keys[keys.length - 1];

  const addExperience = () => setExperienceCount((n) => n + 1);
  const removeExperienceAt = (rowIndex) => {
    if (experienceCount <= 1) return;
    const next = remapModernRemoveExperienceRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      skillCount,
      langCount,
    );
    replaceFieldValues(next);
    setExperienceCount((n) => n - 1);
  };

  const addEducation = () => setEducationCount((n) => n + 1);
  const removeEducationAt = (rowIndex) => {
    if (educationCount <= 1) return;
    const next = remapModernRemoveEducationRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      skillCount,
      langCount,
    );
    replaceFieldValues(next);
    setEducationCount((n) => n - 1);
  };

  const addSkill = () => setSkillCount((n) => n + 1);
  const removeSkillAt = (rowIndex) => {
    if (skillCount <= 1) return;
    const next = remapModernRemoveSkillAt(
      fieldValues,
      experienceCount,
      educationCount,
      skillCount,
      langCount,
      rowIndex,
    );
    replaceFieldValues(next);
    setSkillCount((n) => n - 1);
  };

  const addLanguage = () => setLangCount((n) => n + 1);
  const removeLanguageAt = (rowIndex) => {
    if (langCount <= 1) return;
    const next = remapModernRemoveLangAt(
      fieldValues,
      experienceCount,
      educationCount,
      skillCount,
      langCount,
      rowIndex,
    );
    replaceFieldValues(next);
    setLangCount((n) => n - 1);
  };

  const clearAll = useCallback(() => {
    clearCtrl();
    setSkillCount(4);
    setLangCount(1);
  }, [clearCtrl]);

  const handleNavigateHome = useCallback(() => {
    clearCtrl();
    setSkillCount(4);
    setLangCount(1);
    window.location.href = "/";
  }, [clearCtrl]);
  
  const structure = { experience: experienceCount, education: educationCount };
  const save = () => saveToCabinet("modern", keys, structure);

  if (!ready) {
    return <div style={{ color: "#fff", textAlign: "center", padding: 40 }}>Загрузка…</div>;
  }

  const navExtra = (
    <>
      {!readOnly && (
        <button type="button" onClick={save} style={{ background: "#166534" }}>
          Сохранить в кабинет
        </button>
      )}
      <button type="button" onClick={() => window.print()} style={{ background: "#1d4ed8" }}>
        Скачать PDF (A4)
      </button>
      {!readOnly && (
        <button type="button" onClick={clearAll}>
          Очистить все поля
        </button>
      )}
    </>
  );

  return (
    <div className="modern-template-page">
      {!embed && <TemplateNav extraActions={navExtra} onNavigateHome={handleNavigateHome} />}
      <div className="resume-container">
        <div className="top-section print-priority-high">
		  {!readOnly && (
            <PhotoUploader onPhotoSelect={setPhoto} currentPhoto={photo} />
          )}
          {readOnly && photo && (
            <div className="avatar-placeholder">
              <img src={photo} alt="Фото" />
            </div>
          )}
          {readOnly && !photo && (
            <div className="avatar-placeholder">
              <span>📷</span>
              <span className="upload-hint">Фото</span>
            </div>
          )}
          <div className="name">
            <span className="bold">
              <EditableField
                fio
                fieldKey={headerKeys[0]}
                value={fieldValues[headerKeys[0]]}
                onChange={setField}
                placeholder="Фамилия"
              />
            </span>
            <span className="bold">
              <EditableField
                fio
                fieldKey={headerKeys[1]}
                value={fieldValues[headerKeys[1]]}
                onChange={setField}
                placeholder="Имя"
              />
            </span>
            <span className="bold">
              <EditableField
                fio
                fieldKey={headerKeys[2]}
                value={fieldValues[headerKeys[2]]}
                onChange={setField}
                placeholder="Отчество"
              />
            </span>
          </div>
          <div className="title">
            <EditableField
              fieldKey={headerKeys[3]}
              value={fieldValues[headerKeys[3]]}
              onChange={setField}
              placeholder="Должность"
            />
          </div>
        </div>

        <div className="content one-column">
          <div className="section print-priority-high contacts-section">
            <h2 className="section-title">Контакты</h2>
            <div className="contact-grid">
              {["Email", "Телефон", "Город", "hh.ru"].map((label, i) => (
                <div key={label} className="contact-item">
                  <div className="contact-icon">{["@", "📱", "📍", "in"][i]}</div>
                  <EditableField
                    fieldKey={contactKeys[i]}
                    value={fieldValues[contactKeys[i]]}
                    onChange={setField}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="section print-priority-high">
            <h2 className="section-title">О себе</h2>
            <div className="summary-box">
              <EditableField
                fieldKey={aboutKey}
                value={fieldValues[aboutKey]}
                onChange={setField}
                placeholder="Расскажите о себе"
              />
            </div>
          </div>

          <div className="section print-priority-medium">
            <h2 className="section-title">Опыт работы</h2>
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
                        <EditableField
                          fieldKey={rk[1]}
                          value={fieldValues[rk[1]]}
                          onChange={setField}
                          placeholder="Период"
                        />
                      </span>
                    </div>
                    <div className="item-company">
                      <EditableField
                        fieldKey={rk[2]}
                        value={fieldValues[rk[2]]}
                        onChange={setField}
                        placeholder="Компания"
                      />
                    </div>
                    <div className="item-description">
                      <EditableField
                        fieldKey={rk[3]}
                        value={fieldValues[rk[3]]}
                        onChange={setField}
                        placeholder="Описание"
                      />
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
                        <EditableField
                          fieldKey={rk[0]}
                          value={fieldValues[rk[0]]}
                          onChange={setField}
                          placeholder="Степень"
                        />
                      </span>
                      <span className="item-date">
                        <EditableField
                          fieldKey={rk[1]}
                          value={fieldValues[rk[1]]}
                          onChange={setField}
                          placeholder="Год"
                        />
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
            <div id="skills-container" className="skills-container">
              {skillKeys.map((sk, idx) => (
                <span key={sk} className="skill-tag" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <EditableField fieldKey={sk} value={fieldValues[sk]} onChange={setField} placeholder="Навык" />
                  {!readOnly && (
                    <button
                      type="button"
                      className="item-remove-btn"
                      onClick={() => removeSkillAt(idx)}
                      disabled={skillCount <= 1}
                      style={{ margin: 0, width: "24px", height: "24px", fontSize: "14px" }}
                    >
                      −
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!readOnly && (
              <div className="experience-controls">
                <button type="button" className="btn-add" onClick={addSkill}>+</button>
              </div>
            )}
          </div>

          <div className="section print-priority-low">
            <h2 className="section-title">Языки</h2>
            <div id="languages-container">
              {Array.from({ length: langCount }).map((_, row) => {
                const base = skillsBase + skillCount + row * 2;
                const lk = keys.slice(base, base + 2);
                return (
                  <div key={`lang-${row}`} className="language-item" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
                    <div className="language-name" style={{ flex: 1 }}>
                      <EditableField
                        fieldKey={lk[0]}
                        value={fieldValues[lk[0]]}
                        onChange={setField}
                        placeholder="Язык"
                      />
                      <EditableField
                        fieldKey={lk[1]}
                        value={fieldValues[lk[1]]}
                        onChange={setField}
                        placeholder="Уровень"
                      />
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => removeLanguageAt(row)}
                        disabled={langCount <= 1}
                        style={{ margin: 0 }}
                      >
                        −
                      </button>
                    )}
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: "100%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <div className="experience-controls">
                <button type="button" className="btn-add" onClick={addLanguage}>+</button>
              </div>
            )}
          </div>

          <div className="section">
            <h2 className="section-title">Дополнительно</h2>
            <EditableField
              fieldKey={interestsKey}
              value={fieldValues[interestsKey]}
              onChange={setField}
              placeholder="Ваши интересы"
            />
          </div>
        </div>
      </div>
      {!embed && readOnly && <ShareQrFooter publicUrl={publicUrl} />}
    </div>
  );
}