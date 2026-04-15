/** Merged placeholder maps from legacy templates — keys must match saved resume payloads. */

const PLACEHOLDER_MAP = {
  фамилия: "last_name",
  имя: "first_name",
  отчество: "middle_name",
  должность: "position",
  email: "email",
  телефон: "phone",
  город: "city",
  локация: "city",
  "о себе": "about",
  "краткое описание вашего профессионального опыта": "about",
  "расскажите о себе": "about",
  "расскажите свою историю": "about",
  компания: "company",
  "название компании": "company",
  период: "period",
  "период работы": "period",
  описание: "description",
  "описание обязанностей": "description",
  степень: "education_degree",
  "степень / специальность": "education_degree",
  год: "education_year",
  "год окончания": "education_year",
  "учебное заведение": "education_place",
  "перечислите инструменты": "additional",
  "по запросу": "additional",
  "ваши интересы": "additional",
};

export function normalizePlaceholder(value) {
  const source = (value || "").trim().toLowerCase();
  return PLACEHOLDER_MAP[source] || source;
}

export function buildKeyList(descriptors) {
  const tallies = {};
  return descriptors.map(({ group, placeholder }) => {
    const n = normalizePlaceholder(placeholder);
    const tk = `${group}::${n}`;
    const idx = tallies[tk] ?? 0;
    tallies[tk] = idx + 1;
    return `${group}::${n}::${idx}`;
  });
}

export function payloadFromState(keys, fieldValues, structure) {
  const fields = {};
  keys.forEach((key) => {
    const v = String(fieldValues[key] ?? "")
      .replace(/\u00a0/g, " ")
      .trim();
    if (v) fields[key] = v;
  });
  return { fields, structure };
}
