import { buildKeyList } from "./resumeNormalize.js";

export function itDescriptors(expCount, eduCount, techCount, projectCount, certCount) {
  const g = "general";
  const x = "experience";
  const e = "education";
  const d = [];

  d.push(
    { group: g, placeholder: "Фамилия" },
    { group: g, placeholder: "Имя" },
    { group: g, placeholder: "Отчество" },
    { group: g, placeholder: "Должность" },
    { group: g, placeholder: "Email" },
    { group: g, placeholder: "Телефон" },
    { group: g, placeholder: "Город" },
    { group: g, placeholder: "LinkedIn / GitHub" }
  );
  d.push({ group: g, placeholder: "Краткое описание вашего опыта в IT" });

  for (let i = 0; i < expCount; i++) {
    d.push(
      { group: x, placeholder: "Должность" },
      { group: x, placeholder: "Период" },
      { group: x, placeholder: "Компания" },
      { group: x, placeholder: "Обязанности и достижения" }
    );
  }
  for (let i = 0; i < eduCount; i++) {
    d.push(
      { group: e, placeholder: "Степень / Специальность" },
      { group: e, placeholder: "Год окончания" },
      { group: e, placeholder: "Учебное заведение" }
    );
  }
  for (let i = 0; i < techCount; i++) {
    d.push({ group: g, placeholder: "Технология / Инструмент" });
  }
  for (let i = 0; i < projectCount; i++) {
    d.push(
      { group: g, placeholder: "Название проекта" },
      { group: g, placeholder: "Описание проекта" },
      { group: g, placeholder: "Ссылка на проект" }
    );
  }
  for (let i = 0; i < certCount; i++) {
    d.push(
      { group: g, placeholder: "Название сертификата" },
      { group: g, placeholder: "Организация" },
      { group: g, placeholder: "Год получения" }
    );
  }
  d.push({ group: g, placeholder: "Языки, дополнительные курсы" });
  return d;
}

export function itExpBase(techCount, projectCount, certCount) { return 9; }
export function itEduBase(expCount, techCount, projectCount, certCount) { return 9 + expCount * 4; }
export function itTechBase(expCount, eduCount, projectCount, certCount) { return 9 + expCount * 4 + eduCount * 3; }
export function itProjectBase(expCount, eduCount, techCount, certCount) { return 9 + expCount * 4 + eduCount * 3 + techCount; }
export function itCertBase(expCount, eduCount, techCount, projectCount) { return 9 + expCount * 4 + eduCount * 3 + techCount + projectCount * 3; }

export function remapItRemoveExperienceRow(fieldValues, rowIndex, oldExp, edu, tech, proj, cert) {
  const newExp = oldExp - 1;
  const oldD = itDescriptors(oldExp, edu, tech, proj, cert);
  const newD = itDescriptors(newExp, edu, tech, proj, cert);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = itExpBase(tech, proj, cert);
  const skipStart = base + rowIndex * 4;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 4;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapItRemoveEducationRow(fieldValues, rowIndex, exp, oldEdu, tech, proj, cert) {
  const newEdu = oldEdu - 1;
  const oldD = itDescriptors(exp, oldEdu, tech, proj, cert);
  const newD = itDescriptors(exp, newEdu, tech, proj, cert);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = itEduBase(exp, tech, proj, cert);
  const skipStart = base + rowIndex * 3;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 3;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapItRemoveTechAt(fieldValues, exp, edu, tech, proj, cert, removeIdx) {
  const oldD = itDescriptors(exp, edu, tech, proj, cert);
  const newD = itDescriptors(exp, edu, tech - 1, proj, cert);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = itTechBase(exp, edu, proj, cert);
  const removePos = base + removeIdx;
  const next = {};
  let ni = 0;
  for (let oi = 0; oi < oldK.length; oi++) {
    if (oi === removePos) continue;
    const v = fieldValues[oldK[oi]];
    if (v) next[newK[ni]] = v;
    ni++;
  }
  return next;
}

export function remapItRemoveProjectAt(fieldValues, exp, edu, tech, proj, cert, removeIdx) {
  const oldD = itDescriptors(exp, edu, tech, proj, cert);
  const newD = itDescriptors(exp, edu, tech, proj - 1, cert);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = itProjectBase(exp, edu, tech, cert);
  const removeStart = base + removeIdx * 3;
  const next = {};
  let ni = 0;
  for (let oi = 0; oi < oldK.length; oi++) {
    if (oi >= removeStart && oi < removeStart + 3) continue;
    const v = fieldValues[oldK[oi]];
    if (v) next[newK[ni]] = v;
    ni++;
  }
  return next;
}

export function remapItRemoveCertAt(fieldValues, exp, edu, tech, proj, cert, removeIdx) {
  const oldD = itDescriptors(exp, edu, tech, proj, cert);
  const newD = itDescriptors(exp, edu, tech, proj, cert - 1);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = itCertBase(exp, edu, tech, proj);
  const removeStart = base + removeIdx * 3;
  const next = {};
  let ni = 0;
  for (let oi = 0; oi < oldK.length; oi++) {
    if (oi >= removeStart && oi < removeStart + 3) continue;
    const v = fieldValues[oldK[oi]];
    if (v) next[newK[ni]] = v;
    ni++;
  }
  return next;
}