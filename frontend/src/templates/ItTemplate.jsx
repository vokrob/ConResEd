import { useCallback, useMemo, useState } from "react";
import { EditableField } from "./EditableField.jsx";
import { TemplateNav } from "./TemplateNav.jsx";
import { buildKeyList } from "./resumeNormalize.js";
import { useResumeTemplateController } from "./useResumeTemplateController.js";
import { ShareQrFooter } from "./ShareQrFooter.jsx";
import { PhotoUploader } from "../components/PhotoUploader.jsx";
import {
  itDescriptors,
  itExpBase,
  itEduBase,
  itTechBase,
  itProjectBase,
  itCertBase,
  remapItRemoveExperienceRow,
  remapItRemoveEducationRow,
  remapItRemoveTechAt,
  remapItRemoveProjectAt,
  remapItRemoveCertAt,
} from "./itDescriptors.js";
import "./styles/it.css";

export default function ItTemplate() {
  const ctrl = useResumeTemplateController({ templateId: "it" });
  const [techCount, setTechCount] = useState(5);
  const [projectCount, setProjectCount] = useState(1);
  const [certCount, setCertCount] = useState(1);

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
    () => itDescriptors(experienceCount, educationCount, techCount, projectCount, certCount),
    [experienceCount, educationCount, techCount, projectCount, certCount]
  );
  const keys = useMemo(() => buildKeyList(descriptors), [descriptors]);

  const headerKeys = keys.slice(0, 8);
  const aboutKey = keys[8];
  const expBase = itExpBase(techCount, projectCount, certCount);
  const eduBase = itEduBase(experienceCount, techCount, projectCount, certCount);
  const techBase = itTechBase(experienceCount, educationCount, projectCount, certCount);
  const projectBase = itProjectBase(experienceCount, educationCount, techCount, certCount);
  const certBase = itCertBase(experienceCount, educationCount, techCount, projectCount);
  const extraKey = keys[keys.length - 1];

  const techKeys = keys.slice(techBase, techBase + techCount);
  const projectKeys = keys.slice(projectBase, projectBase + projectCount * 3);
  const certKeys = keys.slice(certBase, certBase + certCount * 3);

  const addExperience = () => setExperienceCount((n) => n + 1);
  const removeExperienceAt = (rowIndex) => {
    if (experienceCount <= 1) return;
    const next = remapItRemoveExperienceRow(
      fieldValues, rowIndex, experienceCount, educationCount, techCount, projectCount, certCount
    );
    replaceFieldValues(next);
    setExperienceCount((n) => n - 1);
  };

  const addEducation = () => setEducationCount((n) => n + 1);
  const removeEducationAt = (rowIndex) => {
    if (educationCount <= 1) return;
    const next = remapItRemoveEducationRow(
      fieldValues, rowIndex, experienceCount, educationCount, techCount, projectCount, certCount
    );
    replaceFieldValues(next);
    setEducationCount((n) => n - 1);
  };

  const addTech = () => setTechCount((n) => n + 1);
  const removeTechAt = (rowIndex) => {
    if (techCount <= 1) return;
    const next = remapItRemoveTechAt(
      fieldValues, experienceCount, educationCount, techCount, projectCount, certCount, rowIndex
    );
    replaceFieldValues(next);
    setTechCount((n) => n - 1);
  };

  const addProject = () => setProjectCount((n) => n + 1);
  const removeProjectAt = (rowIndex) => {
    if (projectCount <= 1) return;
    const next = remapItRemoveProjectAt(
      fieldValues, experienceCount, educationCount, techCount, projectCount, certCount, rowIndex
    );
    replaceFieldValues(next);
    setProjectCount((n) => n - 1);
  };

  const addCert = () => setCertCount((n) => n + 1);
  const removeCertAt = (rowIndex) => {
    if (certCount <= 1) return;
    const next = remapItRemoveCertAt(
      fieldValues, experienceCount, educationCount, techCount, projectCount, certCount, rowIndex
    );
    replaceFieldValues(next);
    setCertCount((n) => n - 1);
  };

  const clearAll = useCallback(() => {
    clearCtrl();
    setTechCount(5);
    setProjectCount(1);
    setCertCount(1);
  }, [clearCtrl]);

  const handleNavigateHome = useCallback(() => {
    clearCtrl();
    setTechCount(5);
    setProjectCount(1);
    setCertCount(1);
    window.location.href = "/";
  }, [clearCtrl]);

  const structure = { experience: experienceCount, education: educationCount };
  const save = () => saveToCabinet("it", keys, structure);

  if (!ready) {
    return <div style={{ textAlign: "center", padding: 40 }}>Загрузка…</div>;
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
        <button type="button" onClick={clearAll} style={{ background: "#dc3545" }}>
          Очистить все поля
        </button>
      )}
    </>
  );

  return (
    <div className="it-template-page">
      {!embed && <TemplateNav extraActions={navExtra} onNavigateHome={handleNavigateHome} />}
      <div className="resume-container">
        <header className="header">
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
          <div className="header-info">
            <div className="name">
              <EditableField fio fieldKey={headerKeys[0]} value={fieldValues[headerKeys[0]]} onChange={setField} placeholder="Фамилия" />
              <EditableField fio fieldKey={headerKeys[1]} value={fieldValues[headerKeys[1]]} onChange={setField} placeholder="Имя" />
              <EditableField fio fieldKey={headerKeys[2]} value={fieldValues[headerKeys[2]]} onChange={setField} placeholder="Отчество" />
            </div>
            <div className="title">
              <EditableField fieldKey={headerKeys[3]} value={fieldValues[headerKeys[3]]} onChange={setField} placeholder="Должность" />
            </div>
            <div className="contacts">
              <div><span className="contact-icon">✉</span> <EditableField fieldKey={headerKeys[4]} value={fieldValues[headerKeys[4]]} onChange={setField} placeholder="Email" /></div>
              <div><span className="contact-icon">📱</span> <EditableField fieldKey={headerKeys[5]} value={fieldValues[headerKeys[5]]} onChange={setField} placeholder="Телефон" /></div>
              <div><span className="contact-icon">📍</span> <EditableField fieldKey={headerKeys[6]} value={fieldValues[headerKeys[6]]} onChange={setField} placeholder="Город" /></div>
              <div><span className="contact-icon">🔗</span> <EditableField fieldKey={headerKeys[7]} value={fieldValues[headerKeys[7]]} onChange={setField} placeholder="hh.ru" /></div>
            </div>
          </div>
        </header>

        <section className="section">
          <h2 className="section-title">О себе</h2>
          <div className="summary-box">
            <EditableField fieldKey={aboutKey} value={fieldValues[aboutKey]} onChange={setField} placeholder="Краткое описание вашего опыта в IT" />
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Опыт работы</h2>
          {Array.from({ length: experienceCount }).map((_, row) => {
            const base = expBase + row * 4;
            const rk = keys.slice(base, base + 4);
            return (
              <div key={`exp-${row}`} className="experience-item">
                <div className="item-header">
                  <span className="item-title"><EditableField fieldKey={rk[0]} value={fieldValues[rk[0]]} onChange={setField} placeholder="Должность" /></span>
                  <span className="item-date"><EditableField fieldKey={rk[1]} value={fieldValues[rk[1]]} onChange={setField} placeholder="Период" /></span>
                </div>
                <div className="item-company"><EditableField fieldKey={rk[2]} value={fieldValues[rk[2]]} onChange={setField} placeholder="Компания" /></div>
                <div className="item-description"><EditableField fieldKey={rk[3]} value={fieldValues[rk[3]]} onChange={setField} placeholder="Обязанности и достижения" /></div>
                {!readOnly && <button className="item-remove-btn" onClick={() => removeExperienceAt(row)}>−</button>}
              </div>
            );
          })}
          {!readOnly && <button className="btn-add" onClick={addExperience}>+</button>}
        </section>

        <section className="section">
          <h2 className="section-title">Образование</h2>
          {Array.from({ length: educationCount }).map((_, row) => {
            const base = eduBase + row * 3;
            const rk = keys.slice(base, base + 3);
            return (
              <div key={`edu-${row}`} className="education-item">
                <div className="item-header">
                  <span className="item-title"><EditableField fieldKey={rk[0]} value={fieldValues[rk[0]]} onChange={setField} placeholder="Степень / Специальность" /></span>
                  <span className="item-date"><EditableField fieldKey={rk[1]} value={fieldValues[rk[1]]} onChange={setField} placeholder="Год окончания" /></span>
                </div>
                <div className="item-place"><EditableField fieldKey={rk[2]} value={fieldValues[rk[2]]} onChange={setField} placeholder="Учебное заведение" /></div>
                {!readOnly && <button className="item-remove-btn" onClick={() => removeEducationAt(row)}>−</button>}
              </div>
            );
          })}
          {!readOnly && <button className="btn-add" onClick={addEducation}>+</button>}
        </section>

        <section className="section">
          <h2 className="section-title">Технологии и инструменты</h2>
          <div className="skills-list">
            {techKeys.map((sk, idx) => (
              <div key={sk} className="skill-item">
                <EditableField fieldKey={sk} value={fieldValues[sk]} onChange={setField} placeholder="Технология / Инструмент" />
                {!readOnly && <button className="item-remove-btn" onClick={() => removeTechAt(idx)} disabled={techCount <= 1}>−</button>}
              </div>
            ))}
          </div>
          {!readOnly && <button className="btn-add" onClick={addTech}>+</button>}
        </section>

        <section className="section">
          <h2 className="section-title">Проекты</h2>
          <div className="projects-list">
            {Array.from({ length: projectCount }).map((_, row) => {
              const base = projectBase + row * 3;
              const pk = keys.slice(base, base + 3);
              return (
                <div key={`proj-${row}`} className="project-item">
                  <div className="project-name"><EditableField fieldKey={pk[0]} value={fieldValues[pk[0]]} onChange={setField} placeholder="Название проекта" /></div>
                  <div className="project-desc"><EditableField fieldKey={pk[1]} value={fieldValues[pk[1]]} onChange={setField} placeholder="Описание проекта" /></div>
                  <div className="project-link"><EditableField fieldKey={pk[2]} value={fieldValues[pk[2]]} onChange={setField} placeholder="Ссылка на проект" /></div>
                  {!readOnly && <button className="item-remove-btn" onClick={() => removeProjectAt(row)} disabled={projectCount <= 1}>−</button>}
                </div>
              );
            })}
          </div>
          {!readOnly && <button className="btn-add" onClick={addProject}>+</button>}
        </section>

        <section className="section">
          <h2 className="section-title">Сертификаты</h2>
          <div className="certificates-list">
            {Array.from({ length: certCount }).map((_, row) => {
              const base = certBase + row * 3;
              const ck = keys.slice(base, base + 3);
              return (
                <div key={`cert-${row}`} className="cert-item">
                  <div><EditableField fieldKey={ck[0]} value={fieldValues[ck[0]]} onChange={setField} placeholder="Название сертификата" /></div>
                  <div><EditableField fieldKey={ck[1]} value={fieldValues[ck[1]]} onChange={setField} placeholder="Организация" /></div>
                  <div><EditableField fieldKey={ck[2]} value={fieldValues[ck[2]]} onChange={setField} placeholder="Год получения" /></div>
                  {!readOnly && <button className="item-remove-btn" onClick={() => removeCertAt(row)} disabled={certCount <= 1}>−</button>}
                </div>
              );
            })}
          </div>
          {!readOnly && <button className="btn-add" onClick={addCert}>+</button>}
        </section>

        <section className="section">
          <h2 className="section-title">Дополнительно</h2>
          <EditableField fieldKey={extraKey} value={fieldValues[extraKey]} onChange={setField} placeholder="Языки, дополнительные курсы" />
        </section>
      </div>
      {!embed && readOnly && <ShareQrFooter publicUrl={publicUrl} />}
    </div>
  );
}