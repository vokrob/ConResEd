function getValue(map, key) {
  const value = map && typeof map[key] === "string" ? map[key].trim() : "";
  return value;
}

function listByPrefix(map, prefix) {
  if (!map || typeof map !== "object") return [];
  const items = [];
  for (const [key, value] of Object.entries(map)) {
    if (!key.startsWith(prefix)) continue;
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) continue;
    items.push({ key, value: raw });
  }
  return items;
}

function parseIndexedGroup(map, groupPrefix) {
  const entries = listByPrefix(map, `${groupPrefix}::`);
  const rows = new Map();

  for (const { key, value } of entries) {
    // key: group::field::index
    const parts = key.split("::");
    if (parts.length < 3) continue;
    const field = parts[1];
    const index = Number(parts[2]);
    if (!Number.isFinite(index) || index < 0) continue;
    if (!rows.has(index)) rows.set(index, {});
    rows.get(index)[field] = value;
  }

  return Array.from(rows.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, row]) => row);
}

export default function parseResumeData(dataMap) {
  const firstName = getValue(dataMap, "general::first_name::0");
  const lastName = getValue(dataMap, "general::last_name::0");
  const middleName = getValue(dataMap, "general::middle_name::0");

  const fullName = [lastName, firstName, middleName].filter(Boolean).join(" ").trim();
  const position = getValue(dataMap, "general::position::0");
  const about = getValue(dataMap, "general::about::0");

  const email = getValue(dataMap, "general::email::0");
  const phone = getValue(dataMap, "general::phone::0");
  const city = getValue(dataMap, "general::city::0");

  const experience = parseIndexedGroup(dataMap, "experience").map((row) => ({
    position: row.position || "",
    period: row.period || "",
    company: row.company || "",
    description: row.description || "",
  }));

  const education = parseIndexedGroup(dataMap, "education").map((row) => ({
    degree: row.education_degree || "",
    year: row.education_year || "",
    place: row.education_place || "",
  }));

  const skills = listByPrefix(dataMap, "general::навык::").map((x) => x.value);
  // Templates sometimes store skills as empty placeholders; fallback: collect any "skill" placeholders.
  const skillFallback = listByPrefix(dataMap, "general::skill::").map((x) => x.value);
  const mergedSkills = Array.from(new Set([...skills, ...skillFallback])).filter(Boolean);

  return {
    fullName,
    position,
    about,
    contacts: { email, phone, city },
    experience: experience.filter((x) => x.position || x.company || x.description || x.period),
    education: education.filter((x) => x.degree || x.place || x.year),
    skills: mergedSkills,
  };
}

