import { useCallback, useMemo, useState } from "react";
import { buildKeyList } from "./resumeNormalize.js";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
import { ShareQrFooter } from "./ShareQrFooter.jsx";
import {
  professionalDescriptors,
  professionalSkillSectionLength,
  professionalSkillsDescriptorStart,
  remapProfessionalRemoveEducationRow,
  remapProfessionalRemoveExperienceRow,
  remapSequentialFieldValues,
} from "./professionalDescriptors.js";
import { useResumeTemplateController } from "./useResumeTemplateController.js";
import "./styles/professional.css";

// Новая функция для удаления конкретного навыка из плоского списка
function remapProfessionalRemoveSkillAt(
  fieldValues,
  exp,
  edu,
  skillCount,
  certCount,
  langCount,
  removeIdx
) {
  const oldD = professionalDescriptors(exp, edu, [skillCount], certCount, langCount);
  const newD = professionalDescriptors(exp, edu, [skillCount - 1], certCount, langCount);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const skillsStart = professionalSkillsDescriptorStart(exp, edu);
  // Первое поле в блоке навыков — заголовок категории (мы его игнорируем, но он есть)
  const removePosition = skillsStart + 1 + removeIdx;
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

export default function ProfessionalTemplate() {
  const ctrl = useResumeTemplateController({ templateId: "professional" });
  const [skillCount, setSkillCount] = useState(4);
  const [certCount, setCertCount] = useState(1);
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
  } = ctrl;

  // Используем categorySkillCounts как [skillCount] для плоского списка
  const categorySkillCounts = useMemo(() => [skillCount], [skillCount]);

  const descriptors = useMemo(
    () =>
      professionalDescriptors(
        experienceCount,
        educationCount,
        categorySkillCounts,
        certCount,
        langCount,
      ),
    [experienceCount, educationCount, skillCount, certCount, langCount],
  );
  const keys = useMemo(() => buildKeyList(descriptors), [descriptors]);

  const topKeys = keys.slice(0, 4);
  const headerKeys = keys.slice(4, 9);
  const aboutKey = keys[9];
  const expBase = 10;
  const eduBase = expBase + experienceCount * 6;
  const skillsStart = professionalSkillsDescriptorStart(experienceCount, educationCount);
  const skillKeys = keys.slice(skillsStart + 1, skillsStart + 1 + skillCount); // пропускаем заголовок категории
  const certStart = skillsStart + 1 + skillCount;
  const certKeys = keys.slice(certStart, certStart + certCount * 3);
  const langStart = certStart + certCount * 3;
  const langKeys = keys.slice(langStart, langStart + langCount * 2);
  const extraKey = keys[keys.length - 1];

  const applyDescriptorChange = (nextExp, nextEdu, nextSkillCount, nextCert, nextLang) => {
    const oldD = professionalDescriptors(
      experienceCount,
      educationCount,
      [skillCount],
      certCount,
      langCount,
    );
    const newD = professionalDescriptors(nextExp, nextEdu, [nextSkillCount], nextCert, nextLang);
    replaceFieldValues(remapSequentialFieldValues(fieldValues, oldD, newD));
    setExperienceCount(nextExp);
    setEducationCount(nextEdu);
    setSkillCount(nextSkillCount);
    setCertCount(nextCert);
    setLangCount(nextLang);
  };

  const addExperience = () => {
    applyDescriptorChange(experienceCount + 1, educationCount, skillCount, certCount, langCount);
  };

  const removeExperienceAt = (rowIndex) => {
    if (experienceCount <= 1) return;
    const next = remapProfessionalRemoveExperienceRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      [skillCount],
      certCount,
      langCount,
    );
    replaceFieldValues(next);
    setExperienceCount((n) => n - 1);
  };

  const addEducation = () => {
    applyDescriptorChange(experienceCount, educationCount + 1, skillCount, certCount, langCount);
  };

  const removeEducationAt = (rowIndex) => {
    if (educationCount <= 1) return;
    const next = remapProfessionalRemoveEducationRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      [skillCount],
      certCount,
      langCount,
    );
    replaceFieldValues(next);
    setEducationCount((n) => n - 1);
  };

  const addSkill = () => {
    applyDescriptorChange(experienceCount, educationCount, skillCount + 1, certCount, langCount);
  };

  const removeSkillAt = (rowIndex) => {
    if (skillCount <= 1) return;
    const next = remapProfessionalRemoveSkillAt(
      fieldValues,
      experienceCount,
      educationCount,
      skillCount,
      certCount,
      langCount,
      rowIndex,
    );
    replaceFieldValues(next);
    setSkillCount((n) => n - 1);
  };

  const addCertificate = () => {
    applyDescriptorChange(experienceCount, educationCount, skillCount, certCount + 1, langCount);
  };

  const removeCertificateAt = (index) => {
    if (certCount <= 1) return;
    const newCertCount = certCount - 1;
    const oldD = professionalDescriptors(
      experienceCount,
      educationCount,
      [skillCount],
      certCount,
      langCount,
    );
    const newD = professionalDescriptors(
      experienceCount,
      educationCount,
      [skillCount],
      newCertCount,
      langCount,
    );
    const oldK = buildKeyList(oldD);
    const newK = buildKeyList(newD);
    const certStartIdx = certStart;
    const removeStart = certStartIdx + index * 3;
    const next = {};
    let ni = 0;
    for (let oi = 0; oi < oldK.length; oi++) {
      if (oi >= removeStart && oi < removeStart + 3) continue;
      const v = fieldValues[oldK[oi]];
      if (v) next[newK[ni]] = v;
      ni++;
    }
    replaceFieldValues(next);
    setCertCount(newCertCount);
  };

  const addLanguage = () => {
    applyDescriptorChange(experienceCount, educationCount, skillCount, certCount, langCount + 1);
  };

  const removeLanguageAt = (index) => {
    if (langCount <= 1) return;
    const newLangCount = langCount - 1;
    const oldD = professionalDescriptors(
      experienceCount,
      educationCount,
      [skillCount],
      certCount,
      langCount,
    );
    const newD = professionalDescriptors(
      experienceCount,
      educationCount,
      [skillCount],
      certCount,
      newLangCount,
    );
    const oldK = buildKeyList(oldD);
    const newK = buildKeyList(newD);
    const langStartIdx = langStart;
    const removeStart = langStartIdx + index * 2;
    const next = {};
    let ni = 0;
    for (let oi = 0; oi < oldK.length; oi++) {
      if (oi >= removeStart && oi < removeStart + 2) continue;
      const v = fieldValues[oldK[oi]];
      if (v) next[newK[ni]] = v;
      ni++;
    }
    replaceFieldValues(next);
    setLangCount(newLangCount);
  };

  const clearAll = useCallback(() => {
    clearCtrl();
    setSkillCount(4);
    setCertCount(1);
    setLangCount(1);
  }, [clearCtrl]);

  const structure = { experience: experienceCount, education: educationCount };
  const save = () => saveToCabinet("professional", keys, structure);

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
    <div className="professional-template-page">
      {!embed && <TemplateNav extraActions={navExtra} />}
      <div className="resume-container">
        <div className="top-bar print-priority-high">
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">✉</span>
              <EditableField fieldKey={topKeys[0]} value={fieldValues[topKeys[0]]} onChange={setField} placeholder="Email" />
            </div>
            <div className="contact-item">
              <span className="contact-icon">☎</span>
              <EditableField fieldKey={topKeys[1]} value={fieldValues[topKeys[1]]} onChange={setField} placeholder="Телефон" />
            </div>
            <div className="contact-item">
              <span className="contact-icon">hh</span>
              <EditableField fieldKey={topKeys[2]} value={fieldValues[topKeys[2]]} onChange={setField} placeholder="hh.ru" />
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">⌖</span>
            <EditableField fieldKey={topKeys[3]} value={fieldValues[topKeys[3]]} onChange={setField} placeholder="Город" />
          </div>
        </div>

        <header className="header print-priority-high">
          <div className="avatar-placeholder">📷 Фото</div>
          <div className="name-block">
            <div>
              <div className="name">
                <EditableField fio fieldKey={headerKeys[0]} value={fieldValues[headerKeys[0]]} onChange={setField} placeholder="Фамилия" />
                <EditableField fio fieldKey={headerKeys[1]} value={fieldValues[headerKeys[1]]} onChange={setField} placeholder="Имя" />
                <EditableField fio fieldKey={headerKeys[2]} value={fieldValues[headerKeys[2]]} onChange={setField} placeholder="Отчество" />
              </div>
            </div>
          </div>
        </header>

        <div className="target-position-wrapper print-priority-high">
          <div className="target-label">Целевая позиция</div>
          <div className="target-title">
            <EditableField fieldKey={headerKeys[4]} value={fieldValues[headerKeys[4]]} onChange={setField} placeholder="Должность" />
          </div>
        </div>

        <div className="content one-column">
          <div className="section print-priority-high">
            <h2 className="section-title">
              <span className="section-icon">◆</span>
              О себе
            </h2>
            <div className="summary-box">
              <EditableField
                fieldKey={aboutKey}
                value={fieldValues[aboutKey]}
                onChange={setField}
                placeholder="Краткое описание вашего профессионального опыта"
              />
            </div>
          </div>

          <div className="section print-priority-medium">
            <h2 className="section-title">
              <span className="section-icon">◆</span>
              Опыт работы
            </h2>
            <div id="experience-container">
              {Array.from({ length: experienceCount }).map((_, row) => {
                const base = expBase + row * 6;
                const rk = keys.slice(base, base + 6);
                return (
                  <div key={`exp-${row}`} className="experience-item">
                    <div className="item-header">
                      <span className="item-title">
                        <EditableField fieldKey={rk[0]} value={fieldValues[rk[0]]} onChange={setField} placeholder="Должность" />
                      </span>
                      <span className="item-date">
                        <EditableField fieldKey={rk[1]} value={fieldValues[rk[1]]} onChange={setField} placeholder="Период" />
                      </span>
                    </div>
                    <div className="item-company">
                      <span>
                        <EditableField fieldKey={rk[2]} value={fieldValues[rk[2]]} onChange={setField} placeholder="Компания" />
                      </span>
                      <span className="item-location">
                        <EditableField fieldKey={rk[3]} value={fieldValues[rk[3]]} onChange={setField} placeholder=" | Город" />
                      </span>
                    </div>
                    <div className="item-description">
                      <EditableField
                        fieldKey={rk[4]}
                        value={fieldValues[rk[4]]}
                        onChange={setField}
                        placeholder="Описание обязанностей"
                      />
                    </div>
                    <ul className="achievements-list">
                      <li>
                        <EditableField fieldKey={rk[5]} value={fieldValues[rk[5]]} onChange={setField} placeholder="Достижение" />
                      </li>
                    </ul>
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
            <h2 className="section-title">
              <span className="section-icon">◆</span>
              Образование
            </h2>
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
                      <EditableField fieldKey={rk[2]} value={fieldValues[rk[2]]} onChange={setField} placeholder="Учебное заведение" />
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

          <div className="sidebar-section print-priority-medium">
            <h3 className="sidebar-title">Компетенции</h3>
            <div id="skills-container" className="skills-list" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {skillKeys.map((sk, idx) => (
                <span key={sk} className="skill-tag" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "6px" }}>
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

          <div className="sidebar-section print-priority-low">
            <h3 className="sidebar-title">Сертификаты</h3>
            <div id="certificates-container">
              {Array.from({ length: certCount }).map((_, row) => {
                const base = row * 3;
                const ck = certKeys.slice(base, base + 3);
                return (
                  <div key={`cert-${row}`} className="cert-item" style={{ position: "relative" }}>
                    <div className="cert-name">
                      <EditableField fieldKey={ck[0]} value={fieldValues[ck[0]]} onChange={setField} placeholder="Название" />
                    </div>
                    <div className="cert-org">
                      <EditableField fieldKey={ck[1]} value={fieldValues[ck[1]]} onChange={setField} placeholder="Организация" />
                    </div>
                    <div className="cert-date">
                      <EditableField fieldKey={ck[2]} value={fieldValues[ck[2]]} onChange={setField} placeholder="Год" />
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => removeCertificateAt(row)}
                        disabled={certCount <= 1}
                        style={{ position: "absolute", top: "8px", right: "8px" }}
                      >
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <div className="experience-controls">
                <button type="button" className="btn-add" onClick={addCertificate}>+</button>
              </div>
            )}
          </div>

          <div className="sidebar-section print-priority-low">
            <h3 className="sidebar-title">Языки</h3>
            <div id="languages-container">
              {Array.from({ length: langCount }).map((_, row) => {
                const base = row * 2;
                const lk = langKeys.slice(base, base + 2);
                return (
                  <div key={`lang-${row}`} className="language-item" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
                    <span className="language-name" style={{ flex: 1 }}>
                      <EditableField fieldKey={lk[0]} value={fieldValues[lk[0]]} onChange={setField} placeholder="Язык" />
                    </span>
                    <span className="language-level">
                      <EditableField fieldKey={lk[1]} value={fieldValues[lk[1]]} onChange={setField} placeholder="Уровень" />
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => removeLanguageAt(row)}
                        disabled={langCount <= 1}
                      >
                        −
                      </button>
                    )}
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

          <div className="sidebar-section print-priority-low">
            <h3 className="sidebar-title">Дополнительно</h3>
            <EditableField
              fieldKey={extraKey}
              value={fieldValues[extraKey]}
              onChange={setField}
              placeholder="По запросу"
            />
          </div>
        </div>
      </div>
      {!embed && readOnly && <ShareQrFooter publicUrl={publicUrl} />}
    </div>
  );
}