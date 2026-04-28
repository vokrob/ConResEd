import { buildKeyList } from "./resumeNormalize.js";

const PRO_PREFIX = 10;
const FIELDS_PER_EXP = 6;
const FIELDS_PER_EDU = 3;

export function professionalSkillsDescriptorStart(exp, edu) {
  return PRO_PREFIX + exp * FIELDS_PER_EXP + edu * FIELDS_PER_EDU;
}

/** categorySkillCounts: число полей «Навык» в каждой категории (заголовок категории добавляется автоматически). */
export function professionalDescriptors(exp, edu, categorySkillCounts, certCount, langCount) {
  const g = "general";
  const x = "experience";
  const e = "education";
  const d = [];
  d.push(
    { group: g, placeholder: "Email" },
    { group: g, placeholder: "Телефон" },
    { group: g, placeholder: "hh.ru" },
    { group: g, placeholder: "Город" },
    { group: g, placeholder: "Фамилия" },
    { group: g, placeholder: "Имя" },
    { group: g, placeholder: "Отчество" },
    { group: g, placeholder: "Сертификаты" },
    { group: g, placeholder: "Должность" },
    { group: g, placeholder: "Краткое описание вашего профессионального опыта" },
  );
  for (let i = 0; i < exp; i++) {
    d.push(
      { group: x, placeholder: "Должность" },
      { group: x, placeholder: "Период" },
      { group: x, placeholder: "Компания" },
      { group: x, placeholder: " | Город" },
      { group: x, placeholder: "Описание обязанностей" },
      { group: x, placeholder: "Достижение" },
    );
  }
  for (let i = 0; i < edu; i++) {
    d.push(
      { group: e, placeholder: "Степень" },
      { group: e, placeholder: "Год" },
      { group: e, placeholder: "Учебное заведение" },
    );
  }
  for (const n of categorySkillCounts) {
    d.push({ group: g, placeholder: "Категория" });
    for (let k = 0; k < n; k++) {
      d.push({ group: g, placeholder: "Навык" });
    }
  }
  for (let i = 0; i < certCount; i++) {
    d.push(
      { group: g, placeholder: "Название" },
      { group: g, placeholder: "Организация" },
      { group: g, placeholder: "Год" },
    );
  }
  for (let i = 0; i < langCount; i++) {
    d.push({ group: g, placeholder: "Язык" }, { group: g, placeholder: "Уровень" });
  }
  d.push({ group: g, placeholder: "По запросу" });
  return d;
}

export function professionalSkillSectionLength(categorySkillCounts) {
  let n = 0;
  for (const c of categorySkillCounts) {
    n += 1 + c;
  }
  return n;
}

export function remapProfessionalRemoveExperienceRow(fieldValues, rowIndex, oldExp, edu, cats, cert, lang) {
  const newExp = oldExp - 1;
  const oldD = professionalDescriptors(oldExp, edu, cats, cert, lang);
  const newD = professionalDescriptors(newExp, edu, cats, cert, lang);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const skipStart = PRO_PREFIX + rowIndex * FIELDS_PER_EXP;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + FIELDS_PER_EXP;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapProfessionalRemoveEducationRow(fieldValues, rowIndex, exp, oldEdu, cats, cert, lang) {
  const newEdu = oldEdu - 1;
  const oldD = professionalDescriptors(exp, oldEdu, cats, cert, lang);
  const newD = professionalDescriptors(exp, newEdu, cats, cert, lang);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const skipStart = PRO_PREFIX + exp * FIELDS_PER_EXP + rowIndex * FIELDS_PER_EDU;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + FIELDS_PER_EDU;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapProfessionalRemoveLastSkill(categorySkillCounts) {
  const next = [...categorySkillCounts];
  if (next.length === 0) return next;
  const last = next.length - 1;
  if (next[last] <= 1) {
    if (next.length <= 1) return next;
    next.pop();
  } else {
    next[last] -= 1;
  }
  return next;
}

export function remapProfessionalAddSkill(categorySkillCounts) {
  const next = [...categorySkillCounts];
  if (next.length === 0) return [1];
  next[next.length - 1] += 1;
  return next;
}

/** Сохраняет значения по порядку полей при изменении структуры (как визуальный порядок в документе). */
export function remapSequentialFieldValues(fieldValues, oldD, newD) {
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const v = j < oldK.length ? fieldValues[oldK[j]] : undefined;
    const t = String(v || "")
      .replace(/\u00a0/g, " ")
      .trim();
    if (t) next[newK[j]] = t;
  }
  return next;
}
