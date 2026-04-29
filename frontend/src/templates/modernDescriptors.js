import { buildKeyList } from "./resumeNormalize.js";

export const MODERN_PREFIX = 9;

export function modernDescriptors(expCount, eduCount, skillCount, langCount) {
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
    { group: g, placeholder: "hh.ru" },
    { group: g, placeholder: "Расскажите о себе" },
  );
  for (let i = 0; i < expCount; i++) {
    d.push(
      { group: x, placeholder: "Должность" },
      { group: x, placeholder: "Период" },
      { group: x, placeholder: "Компания" },
      { group: x, placeholder: "Описание" },
    );
  }
  for (let i = 0; i < eduCount; i++) {
    d.push(
      { group: e, placeholder: "Степень" },
      { group: e, placeholder: "Год" },
      { group: e, placeholder: "Учебное заведение" },
    );
  }
  for (let i = 0; i < skillCount; i++) {
    d.push({ group: g, placeholder: "Навык" });
  }
  for (let i = 0; i < langCount; i++) {
    d.push({ group: g, placeholder: "Язык" }, { group: g, placeholder: "Уровень" });
  }
  d.push({ group: g, placeholder: "Ваши интересы" });
  return d;
}

export function remapModernRemoveExperienceRow(fieldValues, rowIndex, oldExp, edu, skills, langs) {
  const newExp = oldExp - 1;
  const oldD = modernDescriptors(oldExp, edu, skills, langs);
  const newD = modernDescriptors(newExp, edu, skills, langs);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = MODERN_PREFIX;
  const skipStart = base + rowIndex * 4;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 4;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapModernRemoveEducationRow(fieldValues, rowIndex, exp, oldEdu, skills, langs) {
  const newEdu = oldEdu - 1;
  const oldD = modernDescriptors(exp, oldEdu, skills, langs);
  const newD = modernDescriptors(exp, newEdu, skills, langs);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = MODERN_PREFIX + exp * 4;
  const skipStart = base + rowIndex * 3;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 3;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function modernSkillsBase(exp, edu) {
  return MODERN_PREFIX + exp * 4 + edu * 3;
}

export function remapModernRemoveSkill(fieldValues, exp, edu, skills, langs) {
  const oldD = modernDescriptors(exp, edu, skills, langs);
  const newD = modernDescriptors(exp, edu, skills - 1, langs);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = modernSkillsBase(exp, edu);
  const removeIdx = base + skills - 1;
  const next = {};
  let ni = 0;
  for (let oi = 0; oi < oldK.length; oi++) {
    if (oi === removeIdx) continue;
    const v = fieldValues[oldK[oi]];
    if (v) next[newK[ni]] = v;
    ni++;
  }
  return next;
}

export function remapModernRemoveLang(fieldValues, exp, edu, skills, oldLang) {
  const newLang = oldLang - 1;
  const oldD = modernDescriptors(exp, edu, skills, oldLang);
  const newD = modernDescriptors(exp, edu, skills, newLang);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = modernSkillsBase(exp, edu) + skills;
  const removeFirst = base + 2 * (oldLang - 1);
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
