import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RESUME_FIELDS_STORAGE_KEY, RESUME_STRUCTURE_STORAGE_KEY } from "./storageKeys";

export function useResumeTemplateController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  const blank = searchParams.get("blank") === "1";
  const readOnly = searchParams.get("readonly") === "1";

  const [fieldValues, setFieldValuesState] = useState({});
  const [experienceCount, setExperienceCount] = useState(1);
  const [educationCount, setEducationCount] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (resumeId) {
        try {
          const r = await fetch(`/api/resumes/${resumeId}`, { credentials: "include" });
          if (r.ok) {
            const data = await r.json();
            const payload = data?.item?.payload || {};
            if (payload.structure) {
              localStorage.setItem(RESUME_STRUCTURE_STORAGE_KEY, JSON.stringify(payload.structure));
            }
            if (payload.fields) {
              localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(payload.fields));
            }
            if (!cancelled) {
              setFieldValuesState(payload.fields || {});
              const st = payload.structure || {};
              setExperienceCount(Math.max(1, Number(st.experience) || 1));
              setEducationCount(Math.max(1, Number(st.education) || 1));
            }
          }
        } catch {
          /* ignore */
        }
        if (!cancelled) setReady(true);
        return;
      }
      if (blank) {
        if (!cancelled) {
          setFieldValuesState({});
          setExperienceCount(1);
          setEducationCount(1);
        }
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const fr = localStorage.getItem(RESUME_FIELDS_STORAGE_KEY);
        if (fr) setFieldValuesState(JSON.parse(fr));
        const sr = localStorage.getItem(RESUME_STRUCTURE_STORAGE_KEY);
        if (sr) {
          const st = JSON.parse(sr);
          setExperienceCount(Math.max(1, Number(st.experience) || 1));
          setEducationCount(Math.max(1, Number(st.education) || 1));
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [resumeId, blank]);

  useEffect(() => {
    if (!ready || readOnly) return;
    localStorage.setItem(
      RESUME_STRUCTURE_STORAGE_KEY,
      JSON.stringify({ experience: experienceCount, education: educationCount }),
    );
  }, [experienceCount, educationCount, ready, readOnly]);

  useEffect(() => {
    document.documentElement.classList.toggle("template-readonly", readOnly);
    return () => document.documentElement.classList.remove("template-readonly");
  }, [readOnly]);

  const setField = useCallback((key, raw) => {
    if (readOnly) return;
    setFieldValuesState((prev) => {
      const next = { ...prev };
      const t = String(raw || "")
        .replace(/\u00a0/g, " ")
        .trim();
      if (!t) delete next[key];
      else next[key] = t;
      const cleaned = {};
      Object.entries(next).forEach(([k, v]) => {
        const u = String(v || "")
          .replace(/\u00a0/g, " ")
          .trim();
        if (u) cleaned[k] = u;
      });
      localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(cleaned));
      return next;
    });
  }, [readOnly]);

  const clearAllFields = useCallback(() => {
    if (readOnly) return;
    setFieldValuesState({});
    localStorage.removeItem(RESUME_FIELDS_STORAGE_KEY);
    localStorage.removeItem(RESUME_STRUCTURE_STORAGE_KEY);
    setExperienceCount(1);
    setEducationCount(1);
  }, [readOnly]);

  const replaceFieldValues = useCallback((next) => {
    if (readOnly) return;
    setFieldValuesState(next);
    const cleaned = {};
    Object.entries(next).forEach(([k, v]) => {
      const u = String(v || "")
        .replace(/\u00a0/g, " ")
        .trim();
      if (u) cleaned[k] = u;
    });
    localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(cleaned));
  }, [readOnly]);

  const saveToCabinet = useCallback(
    async (templateId, keys, structure) => {
      if (readOnly) return;
      const fields = {};
      keys.forEach((k) => {
        const v = String(fieldValues[k] ?? "")
          .replace(/\u00a0/g, " ")
          .trim();
        if (v) fields[k] = v;
      });
      const fieldsRaw = JSON.stringify(fields);
      const structureRaw = JSON.stringify(structure);
      localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, fieldsRaw);
      localStorage.setItem(RESUME_STRUCTURE_STORAGE_KEY, structureRaw);

      const updateExisting = resumeId
        ? window.confirm(
            "Обновить текущее сохраненное резюме?\nНажмите Отмена, чтобы сохранить как новое.",
          )
        : false;
      const title = window.prompt("Название шаблона", `Мое резюме (${templateId})`) || "";
      if (!title.trim()) return;
      const url = updateExisting ? `/api/resumes/${resumeId}` : "/api/resumes";
      const method = updateExisting ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          title,
          payload: { fields: JSON.parse(fieldsRaw), structure: JSON.parse(structureRaw) },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        if (!updateExisting && result?.item?.id) {
          const next = new URLSearchParams(searchParams);
          next.set("resumeId", String(result.item.id));
          next.delete("blank");
          setSearchParams(next, { replace: true });
        }
        alert(updateExisting ? "Изменения сохранены" : "Шаблон сохранен в личный кабинет");
      } else {
        alert(result?.error || "Не удалось сохранить шаблон");
      }
    },
    [fieldValues, readOnly, resumeId, searchParams, setSearchParams],
  );

  return {
    resumeId,
    blank,
    readOnly,
    fieldValues,
    setField,
    replaceFieldValues,
    experienceCount,
    setExperienceCount,
    educationCount,
    setEducationCount,
    clearAllFields,
    saveToCabinet,
    ready,
    searchParams,
    setSearchParams,
  };
}
