import { useCallback, useMemo, useState } from "react";
import { buildKeyList } from "./resumeNormalize.js";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
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

export default function ProfessionalTemplate() {
  const ctrl = useResumeTemplateController();
  const [categorySkillCounts, setCategorySkillCounts] = useState([2]);
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
  } = ctrl;

  const descriptors = useMemo(
    () =>
      professionalDescriptors(
        experienceCount,
        educationCount,
        categorySkillCounts,
        certCount,
        langCount,
      ),
    [experienceCount, educationCount, categorySkillCounts, certCount, langCount],
  );
  const keys = useMemo(() => buildKeyList(descriptors), [descriptors]);

  const topKeys = keys.slice(0, 4);
  const headerKeys = keys.slice(4, 9);
  const aboutKey = keys[9];
  const expBase = 10;
  const eduBase = expBase + experienceCount * 6;
  const skillsStart = professionalSkillsDescriptorStart(experienceCount, educationCount);
  const skillSectionLen = professionalSkillSectionLength(categorySkillCounts);
  const skillKeysBlock = keys.slice(skillsStart, skillsStart + skillSectionLen);
  const certStart = skillsStart + skillSectionLen;
  const certKeys = keys.slice(certStart, certStart + certCount * 3);
  const langStart = certStart + certCount * 3;
  const langKeys = keys.slice(langStart, langStart + langCount * 2);
  const extraKey = keys[keys.length - 1];

  const applyDescriptorChange = (nextExp, nextEdu, nextCats, nextCert, nextLang) => {
    const oldD = professionalDescriptors(
      experienceCount,
      educationCount,
      categorySkillCounts,
      certCount,
      langCount,
    );
    const newD = professionalDescriptors(nextExp, nextEdu, nextCats, nextCert, nextLang);
    replaceFieldValues(remapSequentialFieldValues(fieldValues, oldD, newD));
    setExperienceCount(nextExp);
    setEducationCount(nextEdu);
    setCategorySkillCounts(nextCats);
    setCertCount(nextCert);
    setLangCount(nextLang);
  };

  const addExperience = () => {
    applyDescriptorChange(experienceCount + 1, educationCount, categorySkillCounts, certCount, langCount);
  };

  const removeExperienceLast = () => {
    if (experienceCount <= 1) return;
    const next = remapProfessionalRemoveExperienceRow(
      fieldValues,
      experienceCount - 1,
      experienceCount,
      educationCount,
      categorySkillCounts,
      certCount,
      langCount,
    );
    replaceFieldValues(next);
    setExperienceCount((n) => n - 1);
  };

  const removeExperienceAt = (rowIndex) => {
    if (experienceCount <= 1) return;
    const next = remapProfessionalRemoveExperienceRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      categorySkillCounts,
      certCount,
      langCount,
    );
    replaceFieldValues(next);
    setExperienceCount((n) => n - 1);
  };

  const addEducation = () => {
    applyDescriptorChange(experienceCount, educationCount + 1, categorySkillCounts, certCount, langCount);
  };

  const removeEducationLast = () => {
    if (educationCount <= 1) return;
    const next = remapProfessionalRemoveEducationRow(
      fieldValues,
      educationCount - 1,
      experienceCount,
      educationCount,
      categorySkillCounts,
      certCount,
      langCount,
    );
    replaceFieldValues(next);
    setEducationCount((n) => n - 1);
  };

  const removeEducationAt = (rowIndex) => {
    if (educationCount <= 1) return;
    const next = remapProfessionalRemoveEducationRow(
      fieldValues,
      rowIndex,
      experienceCount,
      educationCount,
      categorySkillCounts,
      certCount,
      langCount,
    );
    replaceFieldValues(next);
    setEducationCount((n) => n - 1);
  };

  const addSkillCategory = () => {
    const nextCats = [...categorySkillCounts, 2];
    applyDescriptorChange(experienceCount, educationCount, nextCats, certCount, langCount);
  };

  const removeSkillCategory = () => {
    if (categorySkillCounts.length <= 1) return;
    const nextCats = categorySkillCounts.slice(0, -1);
    applyDescriptorChange(experienceCount, educationCount, nextCats, certCount, langCount);
  };

  const addSkillToLastCategory = () => {
    const nextCats = [...categorySkillCounts];
    nextCats[nextCats.length - 1] += 1;
    applyDescriptorChange(experienceCount, educationCount, nextCats, certCount, langCount);
  };

  const removeSkillFromLastCategory = () => {
    const nextCats = [...categorySkillCounts];
    const last = nextCats.length - 1;
    if (nextCats[last] <= 1) {
      if (nextCats.length <= 1) return;
      nextCats.pop();
    } else {
      nextCats[last] -= 1;
    }
    applyDescriptorChange(experienceCount, educationCount, nextCats, certCount, langCount);
  };

  const addCertificate = () => {
    applyDescriptorChange(experienceCount, educationCount, categorySkillCounts, certCount + 1, langCount);
  };

  const removeCertificateLast = () => {
    if (certCount <= 1) return;
    applyDescriptorChange(experienceCount, educationCount, categorySkillCounts, certCount - 1, langCount);
  };

  const addLanguage = () => {
    applyDescriptorChange(experienceCount, educationCount, categorySkillCounts, certCount, langCount + 1);
  };

  const removeLanguageLast = () => {
    if (langCount <= 1) return;
    applyDescriptorChange(experienceCount, educationCount, categorySkillCounts, certCount, langCount - 1);
  };

  const clearAll = useCallback(() => {
    clearCtrl();
    setCategorySkillCounts([2]);
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
      <button type="button" onClick={save} style={{ background: "#166534" }}>
        Сохранить в кабинет
      </button>
      <button type="button" onClick={() => window.print()} style={{ background: "#1d4ed8" }}>
        Скачать PDF (A4)
      </button>
      <button type="button" onClick={clearAll}>
        Очистить все поля
      </button>
    </>
  );

  let skIdx = 0;
  const renderSkillCategories = () =>
    categorySkillCounts.map((n, ci) => {
      const titleKey = skillKeysBlock[skIdx++];
      const catSkillKeys = [];
      for (let k = 0; k < n; k++) catSkillKeys.push(skillKeysBlock[skIdx++]);
      return (
        <div key={`cat-${ci}`} className="skills-category" data-category-id={ci + 1}>
          <div className="skills-category-title">
            <EditableField fieldKey={titleKey} value={fieldValues[titleKey]} onChange={setField} placeholder="Категория" />
          </div>
          <div className="skills-list" id={`skills-list-${ci + 1}`}>
            {catSkillKeys.map((sk) => (
              <span key={sk} className="skill-tag">
                <EditableField fieldKey={sk} value={fieldValues[sk]} onChange={setField} placeholder="Навык" />
              </span>
            ))}
          </div>
          <div className="skill-mini-controls">
            <button type="button" className="btn-mini" title="Добавить навык" onClick={addSkillToLastCategory}>
              +
            </button>
            <button type="button" className="btn-mini btn-mini-remove" title="Удалить навык" onClick={removeSkillFromLastCategory}>
              -
            </button>
          </div>
        </div>
      );
    });

  return (
    <>
      <TemplateNav extraActions={navExtra} />
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
              <div className="credentials">
                <EditableField fieldKey={headerKeys[3]} value={fieldValues[headerKeys[3]]} onChange={setField} placeholder="Сертификаты" />
              </div>
            </div>
            <div className="target-position">
              <div className="target-label">Целевая позиция</div>
              <div className="target-title">
                <EditableField fieldKey={headerKeys[4]} value={fieldValues[headerKeys[4]]} onChange={setField} placeholder="Должность" />
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="main-grid">
            <div className="main-column">
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
                        <button type="button" className="item-remove-btn" onClick={() => removeExperienceAt(row)}>
                          Удалить этот блок
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="experience-controls">
                  <button type="button" className="btn-add" onClick={addExperience}>
                    + Добавить место работы
                  </button>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={removeExperienceLast}
                    disabled={experienceCount <= 1}
                  >
                    - Удалить последнее
                  </button>
                </div>
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
                        <button type="button" className="item-remove-btn" onClick={() => removeEducationAt(row)}>
                          Удалить этот блок
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="experience-controls">
                  <button type="button" className="btn-add" onClick={addEducation}>
                    + Добавить образование
                  </button>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={removeEducationLast}
                    disabled={educationCount <= 1}
                  >
                    - Удалить последнее
                  </button>
                </div>
              </div>
            </div>

            <div className="sidebar">
              <div className="sidebar-section print-priority-medium">
                <h3 className="sidebar-title">Компетенции</h3>
                <div id="skills-container">{renderSkillCategories()}</div>
                <div className="experience-controls">
                  <button type="button" className="btn-add" onClick={addSkillCategory}>
                    + Добавить категорию
                  </button>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={removeSkillCategory}
                    disabled={categorySkillCounts.length <= 1}
                  >
                    - Удалить последнюю
                  </button>
                </div>
              </div>

              <div className="sidebar-section print-priority-low">
                <h3 className="sidebar-title">Сертификаты</h3>
                <div id="certificates-container">
                  {Array.from({ length: certCount }).map((_, row) => {
                    const base = row * 3;
                    const ck = certKeys.slice(base, base + 3);
                    return (
                      <div key={`cert-${row}`} className="cert-item">
                        <div className="cert-name">
                          <EditableField fieldKey={ck[0]} value={fieldValues[ck[0]]} onChange={setField} placeholder="Название" />
                        </div>
                        <div className="cert-org">
                          <EditableField fieldKey={ck[1]} value={fieldValues[ck[1]]} onChange={setField} placeholder="Организация" />
                        </div>
                        <div className="cert-date">
                          <EditableField fieldKey={ck[2]} value={fieldValues[ck[2]]} onChange={setField} placeholder="Год" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="experience-controls">
                  <button type="button" className="btn-add" onClick={addCertificate}>
                    + Добавить сертификат
                  </button>
                  <button type="button" className="btn-remove" onClick={removeCertificateLast} disabled={certCount <= 1}>
                    - Удалить последний
                  </button>
                </div>
              </div>

              <div className="sidebar-section print-priority-low">
                <h3 className="sidebar-title">Языки</h3>
                <div id="languages-container">
                  {Array.from({ length: langCount }).map((_, row) => {
                    const base = row * 2;
                    const lk = langKeys.slice(base, base + 2);
                    return (
                      <div key={`lang-${row}`} className="language-item">
                        <span className="language-name">
                          <EditableField fieldKey={lk[0]} value={fieldValues[lk[0]]} onChange={setField} placeholder="Язык" />
                        </span>
                        <span className="language-level">
                          <EditableField fieldKey={lk[1]} value={fieldValues[lk[1]]} onChange={setField} placeholder="Уровень" />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="experience-controls">
                  <button type="button" className="btn-add" onClick={addLanguage}>
                    + Добавить язык
                  </button>
                  <button type="button" className="btn-remove" onClick={removeLanguageLast} disabled={langCount <= 1}>
                    - Удалить последний
                  </button>
                </div>
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
        </div>
      </div>
    </>
  );
}
