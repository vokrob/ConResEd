import { buildKeyList } from "./resumeNormalize.js";

const CREATIVE_HEADER = 8;
const CREATIVE_CONTACTS = 5;

export function creativeExpBase(skillCount) {
  return CREATIVE_HEADER + CREATIVE_CONTACTS + skillCount + 2;
}

export function creativeDescriptors(expCount, eduCount, skillCount) {
  const g = "general";
  const x = "experience";
  const e = "education";
  const d = [];
  d.push(
    { group: g, placeholder: "Фамилия" },
    { group: g, placeholder: "Имя" },
    { group: g, placeholder: "Отчество" },
    { group: g, placeholder: "Должность" },
    { group: g, placeholder: "Ваш слоган или краткое описание" },
    { group: g, placeholder: "" },
    { group: g, placeholder: "" },
    { group: g, placeholder: "" },
  );
  d.push(
    { group: g, placeholder: "Email" },
    { group: g, placeholder: "Телефон" },
    { group: g, placeholder: "Сайт" },
    { group: g, placeholder: "hh.ru" },
    { group: g, placeholder: "Локация" },
  );
  for (let i = 0; i < skillCount; i++) {
    d.push({ group: g, placeholder: "Навык" });
  }
  d.push({ group: g, placeholder: "" });
  d.push({ group: g, placeholder: "Расскажите свою историю" });
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
  return d;
}

export function remapCreativeRemoveExperienceRow(fieldValues, rowIndex, oldExp, edu, skills) {
  const newExp = oldExp - 1;
  const oldD = creativeDescriptors(oldExp, edu, skills);
  const newD = creativeDescriptors(newExp, edu, skills);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = creativeExpBase(skills);
  const skipStart = base + rowIndex * 4;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 4;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapCreativeRemoveEducationRow(fieldValues, rowIndex, exp, oldEdu, skills) {
  const newEdu = oldEdu - 1;
  const oldD = creativeDescriptors(exp, oldEdu, skills);
  const newD = creativeDescriptors(exp, newEdu, skills);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const base = creativeExpBase(skills) + exp * 4;
  const skipStart = base + rowIndex * 3;
  const next = {};
  for (let j = 0; j < newK.length; j++) {
    const oj = j < skipStart ? j : j + 3;
    const v = fieldValues[oldK[oj]];
    if (v) next[newK[j]] = v;
  }
  return next;
}

export function remapCreativeRemoveSkill(fieldValues, exp, edu, skills) {
  const oldD = creativeDescriptors(exp, edu, skills);
  const newD = creativeDescriptors(exp, edu, skills - 1);
  const oldK = buildKeyList(oldD);
  const newK = buildKeyList(newD);
  const removeIdx = CREATIVE_HEADER + CREATIVE_CONTACTS + skills - 1;
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
