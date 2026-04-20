import { useCallback, useMemo, useState } from "react";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
import { buildKeyList } from "./resumeNormalize.js";
import { useResumeTemplateController } from "./useResumeTemplateController.js";
import "./styles/classic.css";

const HEADER_ABOUT = 8;

export function classicDescriptors(expCount, eduCount, skillCount) {
  const d = [];
  const g = "general";
  const x = "experience";
  const e = "education";
  d.push(
    { group: g, placeholder: "Фамилия" },
    { group: g, placeholder: "Имя" },
    { group: g, placeholder: "Отчество" },
    { group: g, placeholder: "Должность" },
    { group: g, placeholder: "Email" },
    { group: g, placeholder: "Телефон" },
    { group: g, placeholder: "Город" },
    { group: g, placeholder: "Краткое описание вашего профессионального опыта" },
  );
  for (let i = 0; i < expCount; i++) {
    d.push(
      { group: x, placeholder: "Должность" },
      { group: x, placeholder: "Период работы" },
      { group: x, placeholder: "Название компании" },
      { group: x, placeholder: "Описание обязанностей" },
    );
  }
  for (let i = 0; i < eduCount; i++) {
    d.push(
      { group: e, placeholder: "Степень / Специальность" },
      { group: e, placeholder: "Год окончания" },
      { group: e, placeholder: "Учебное заведение" },
    );
  }
  for (let i = 0; i < skillCount; i++) {
    d.push({ group: g, placeholder: "Навык" });
  }
  d.push({ group: g, placeholder: "Языки, сертификаты, курсы" });
  return d;
}

function remapAfterRemoveExperienceRow(fieldValues, rowIndex, oldExp, edu, skillCount) {
  const newExp = oldExp - 1;
  const oldD = classicDescriptors(oldExp, edu, skillCount);
  const newD = classicDescriptors(newExp, edu, skillCount);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const skipStart = HEADER_ABOUT + rowIndex * 4;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 4;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

function remapAfterRemoveEducationRow(fieldValues, rowIndex, exp, oldEdu, skillCount) {
  const newEdu = oldEdu - 1;
  const oldD = classicDescriptors(exp, oldEdu, skillCount);
  const newD = classicDescriptors(exp, newEdu, skillCount);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const eduBlockStart = HEADER_ABOUT + exp * 4;
  const skipStart = eduBlockStart + rowIndex * 3;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 3;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export default function ClassicTemplate() {
  const ctrl = useResumeTemplateController();
  const [skillCount, setSkillCount] = useState(1);

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
  } = ctrl;

  const descriptors = useMemo(
    () => classicDescriptors(experienceCount, educationCount, skillCount),
    [experienceCount, educationCount, skillCount],
  );
  const keys = useMemo(() => buildKeyList(descriptors), [descriptors]);

  const headerKeys = keys.slice(0, 8);
  const expBase = 8;
  const eduBase = expBase + experienceCount * 4;
  const skillsBase = eduBase + educationCount * 3;
  const skillKeys = keys.slice(skillsBase, skillsBase + skillCount);
  const extraKey = keys[keys.length - 1];

  const addExperience = () => {
    setExperienceCount((n) => n + 1);
  };

  const removeExperienceAt = (rowIndex) => {
    if (experienceCount <= 1) return;
    const next = remapAfterRemoveExperienceRow(
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
    const next = remapAfterRemoveEducationRow(
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
    const oldD = classicDescriptors(experienceCount, educationCount, skillCount);
    const newD = classicDescriptors(experienceCount, educationCount, skillCount - 1);
    const oldK = buildKeyList(oldD);
    const newK = buildKeyList(newD);
    const eduBaseLocal = expBase + experienceCount * 4;
    const skillsBaseLocal = eduBaseLocal + educationCount * 3;
    const removeIdx = skillsBaseLocal + rowIndex;
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
    setSkillCount(1);
  }, [clearCtrl]);

  const structure = { experience: experienceCount, education: educationCount };

  const save = () => saveToCabinet("classic", keys, structure);

  if (!ready) {
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: 40 }}>
        Загрузка…
      </div>
    );
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
    <div className="classic-template-page" lang="ru">
      <TemplateNav extraActions={navExtra} />
      <div className="resume-container">
        <header className="header print-priority-high">
          <div className="avatar-placeholder">📷 Фото</div>
          <div className="header-fio" aria-label="ФИО">
            <div className="header-fio-row">
              <EditableField
                fio
                fieldKey={headerKeys[0]}
                value={fieldValues[headerKeys[0]]}
                onChange={setField}
                placeholder="Фамилия"
              />
            </div>
            <div className="header-fio-row">
              <EditableField
                fio
                fieldKey={headerKeys[1]}
                value={fieldValues[headerKeys[1]]}
                onChange={setField}
                placeholder="Имя"
              />
            </div>
            <div className="header-fio-row">
              <EditableField
                fio
                fieldKey={headerKeys[2]}
                value={fieldValues[headerKeys[2]]}
                onChange={setField}
                placeholder="Отчество"
              />
            </div>
          </div>
        </header>

        <div className="header-meta-below print-priority-high" aria-label="Должность и контакты">
          <div className="header-title">
            <EditableField
              fieldKey={headerKeys[3]}
              value={fieldValues[headerKeys[3]]}
              onChange={setField}
              placeholder="Должность"
            />
          </div>
          <div className="header-contacts" aria-label="Контакты">
            <div className="header-contact-row">
              <EditableField
                fieldKey={headerKeys[4]}
                value={fieldValues[headerKeys[4]]}
                onChange={setField}
                placeholder="Email"
              />
            </div>
            <div className="header-contact-row">
              <EditableField
                fieldKey={headerKeys[5]}
                value={fieldValues[headerKeys[5]]}
                onChange={setField}
                placeholder="Телефон"
              />
            </div>
            <div className="header-contact-row">
              <EditableField
                fieldKey={headerKeys[6]}
                value={fieldValues[headerKeys[6]]}
                onChange={setField}
                placeholder="Город"
              />
            </div>
          </div>
        </div>

        <section className="section print-priority-high">
          <h2 className="section-title">О себе</h2>
          <div className="summary">
            <EditableField
              fieldKey={headerKeys[7]}
              value={fieldValues[headerKeys[7]]}
              onChange={setField}
              placeholder="Краткое описание вашего профессионального опыта"
            />
          </div>
        </section>

        <section className="section print-priority-medium">
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
                        placeholder="Период работы"
                        multiline={false}
                        maxLength={48}
                      />
                    </span>
                  </div>
                  <div className="item-company">
                    <EditableField
                      fieldKey={rk[2]}
                      value={fieldValues[rk[2]]}
                      onChange={setField}
                      placeholder="Название компании"
                    />
                  </div>
                  <div className="item-description">
                    <EditableField
                      fieldKey={rk[3]}
                      value={fieldValues[rk[3]]}
                      onChange={setField}
                      placeholder="Описание обязанностей"
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
        </section>

        <section className="section print-priority-medium">
          <h2 className="section-title">Образование</h2>
          <div id="education-container">
            {Array.from({ length: educationCount }).map((_, row) => {
              const base = eduBase + row * 3;
              const rk = keys.slice(base, base + 3);
              return (
                <div key={`edu-${row}`} className="education-item">
                  <div className="item-header">
                    <span className="item-title">
                      <EditableField
                        fieldKey={rk[0]}
                        value={fieldValues[rk[0]]}
                        onChange={setField}
                        placeholder="Степень / Специальность"
                      />
                    </span>
                    <span className="item-date">
                      <EditableField
                        fieldKey={rk[1]}
                        value={fieldValues[rk[1]]}
                        onChange={setField}
                        placeholder="Год окончания"
                        multiline={false}
                        maxLength={24}
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
        </section>

        <section className="section print-priority-medium">
          <h2 className="section-title">Навыки</h2>
          <div id="skills-container" className="skills-list">
            {skillKeys.map((sk, row) => (
              <div key={sk} className="skill-row">
                <EditableField fieldKey={sk} value={fieldValues[sk]} onChange={setField} placeholder="Навык" />
                {!readOnly && (
                  <button
                    type="button"
                    className="item-remove-btn"
                    onClick={() => removeSkillAt(row)}
                    disabled={skillCount <= 1}
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
        </section>

        <section className="section print-priority-low">
          <h2 className="section-title">Дополнительно</h2>
          <EditableField
            fieldKey={extraKey}
            value={fieldValues[extraKey]}
            onChange={setField}
            placeholder="Языки, сертификаты, курсы"
          />
        </section>
      </div>
    </div>
  );
}