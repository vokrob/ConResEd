import { useCallback, useMemo, useState } from "react";
import { buildKeyList } from "./resumeNormalize.js";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
import { ShareQrFooter } from "./ShareQrFooter.jsx";
import {
  creativeDescriptors,
  creativeExpBase,
  remapCreativeRemoveEducationRow,
  remapCreativeRemoveExperienceRow,
  remapCreativeRemoveSkill,
} from "./creativeDescriptors.js";
import { useResumeTemplateController } from "./useResumeTemplateController.js";
import "./styles/creative.css";

export default function CreativeTemplate() {
  const ctrl = useResumeTemplateController({ templateId: "creative" });
  const [skillCount, setSkillCount] = useState(4);

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
    const oldD = creativeDescriptors(experienceCount, educationCount, skillCount);
    const newD = creativeDescriptors(experienceCount, educationCount, skillCount - 1);
    const oldK = buildKeyList(oldD);
    const newK = buildKeyList(newD);
    const removeIdx = 13 + rowIndex;
    const next = {};
    let ni = 0;
    for (let oi = 0; oi < oldK.length; oi++) {
      if (oi === removeIdx) continue;
      const v = fieldValues[oldK[oi]];
      if (v) next[newK[ni]] = v;
      ni++;
    }
    replaceFieldValues(next);
    setSkillCount((n) => n - 1);
  };

  const clearAll = useCallback(() => {
    clearCtrl();
    setSkillCount(4);
  }, [clearCtrl]);

  const structure = { experience: experienceCount, education: educationCount };
  const save = () => saveToCabinet("creative", keys, structure);

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
    <div className="creative-template-page">
      {!embed && <TemplateNav extraActions={navExtra} />}
      <div className="resume-container">
        <header className="header print-priority-high">
          <div className="header-content">
            <div className="avatar-placeholder">📷 Фото</div>
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
    </div>
  );
}