import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    RESUME_FIELDS_STORAGE_KEY,
    RESUME_STRUCTURE_STORAGE_KEY,
    RESUME_PHOTO_STORAGE_KEY,
    RESUME_PHOTO_SCOPE_STORAGE_KEY,
    RESUME_PHOTO_REMOVED_STORAGE_KEY,
} from "./storageKeys";

const photoStorageScope = (resumeId) => resumeId || "draft";

export function useResumeTemplateController({ templateId } = {}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const resumeId = searchParams.get("resumeId");
    const blank = searchParams.get("blank") === "1";
    const shareToken = searchParams.get("share");
    const embed = searchParams.get("embed") === "1" || Boolean(shareToken);
    const readOnly = searchParams.get("readonly") === "1" || Boolean(shareToken);

    const [fieldValues, setFieldValuesState] = useState({});
    const [experienceCount, setExperienceCount] = useState(1);
    const [educationCount, setEducationCount] = useState(1);
    const [ready, setReady] = useState(false);
    const [publicToken, setPublicToken] = useState("");
    const [currentTitle, setCurrentTitle] = useState("");
    const [photo, setPhotoState] = useState("");
    const [parseWarnings, setParseWarnings] = useState([]);
    const [parseError, setParseError] = useState("");
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [parsedFieldKeys, setParsedFieldKeys] = useState([]);
    const [parseCounts, setParseCounts] = useState({});

    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (shareToken) {
                try {
                    const r = await fetch(`/api/public/resumes/${encodeURIComponent(shareToken)}`);
                    const data = await r.json().catch(() => ({}));
                    if (r.ok) {
                        const payload = data?.item?.payload || {};
                        if (!cancelled) {
                            setFieldValuesState(payload.fields || {});
                            const st = payload.structure || {};
                            setExperienceCount(Math.max(1, Number(st.experience) || 1));
                            setEducationCount(Math.max(1, Number(st.education) || 1));
                            setPhotoState(payload.photo || "");
                        }
                    }
                } catch {}
                if (!cancelled) setReady(true);
                return;
            }
            if (resumeId) {
                try {
                    const r = await fetch(`/api/resumes/${resumeId}`, { credentials: "include" });
                    if (r.ok) {
                        const data = await r.json();
                        const item = data?.item || {};
                        const payload = item?.payload || {};
                        const token = item?.public_token || "";
                        const title = item?.title || "";

                        if (!cancelled && token) setPublicToken(token);
                        if (title) setCurrentTitle(title);
                        if (payload.structure) {
                            localStorage.setItem(RESUME_STRUCTURE_STORAGE_KEY, JSON.stringify(payload.structure));
                        }
                        if (payload.fields) {
                            localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(payload.fields));
                        }
                        const currentPhotoScope = photoStorageScope(resumeId);
                        const removedPhotoScope = localStorage.getItem(RESUME_PHOTO_REMOVED_STORAGE_KEY);
                        const localPhoto = localStorage.getItem(RESUME_PHOTO_STORAGE_KEY);
                        const localPhotoScope = localStorage.getItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
                        const photoWasRemovedHere = removedPhotoScope === currentPhotoScope;
                        const localPhotoAppliesHere = localPhoto && localPhotoScope === currentPhotoScope;
                        const nextPhoto = photoWasRemovedHere ? "" : (localPhotoAppliesHere ? localPhoto : payload.photo || "");
                        if (nextPhoto) {
                            localStorage.setItem(RESUME_PHOTO_STORAGE_KEY, nextPhoto);
                            localStorage.setItem(RESUME_PHOTO_SCOPE_STORAGE_KEY, currentPhotoScope);
                        } else {
                            localStorage.removeItem(RESUME_PHOTO_STORAGE_KEY);
                            localStorage.removeItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
                        }
                        if (!cancelled) {
                            setFieldValuesState(payload.fields || {});
                            const st = payload.structure || {};
                            setExperienceCount(Math.max(1, Number(st.experience) || 1));
                            setEducationCount(Math.max(1, Number(st.education) || 1));
                            setPhotoState(nextPhoto);
                        }
                    }
                } catch {}
                if (!cancelled) setReady(true);
                return;
            }
            if (blank) {
                if (!cancelled) {
                    setFieldValuesState({});
                    setExperienceCount(1);
                    setEducationCount(1);
                    setPhotoState("");
                    setParseCounts({});
                    localStorage.removeItem(`resume-counts-${templateId}`);
                    localStorage.removeItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
                    localStorage.removeItem(RESUME_PHOTO_REMOVED_STORAGE_KEY);
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
                const pr = localStorage.getItem(RESUME_PHOTO_STORAGE_KEY);
                const photoScope = localStorage.getItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
                if (pr && (photoScope === photoStorageScope(resumeId) || (!photoScope && !resumeId))) {
                    setPhotoState(pr);
                    localStorage.setItem(RESUME_PHOTO_SCOPE_STORAGE_KEY, photoStorageScope(resumeId));
                }
                const savedCounts = localStorage.getItem(`resume-counts-${templateId}`);
                if (savedCounts) setParseCounts(JSON.parse(savedCounts));
            } catch {}
            if (!cancelled) setReady(true);
        }
        run();
        return () => { cancelled = true; };
    }, [resumeId, blank, shareToken, templateId]);

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

    useEffect(() => {
        document.documentElement.classList.toggle("template-embed", embed);
        return () => document.documentElement.classList.remove("template-embed");
    }, [embed]);

    const setField = useCallback((key, raw) => {
        if (readOnly) return;
        setFieldValuesState((prev) => {
            const next = { ...prev };
            const t = String(raw || "").replace(/\u00a0/g, " ").trim();
            if (!t) delete next[key];
            else next[key] = t;
            const cleaned = {};
            Object.entries(next).forEach(([k, v]) => {
                const u = String(v || "").replace(/\u00a0/g, " ").trim();
                if (u) cleaned[k] = u;
            });
            localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(cleaned));
            return next;
        });
    }, [readOnly]);

    const clearAllFields = useCallback(() => {
        if (readOnly) return;
        setFieldValuesState({});
        setPhotoState("");
        setParsedFieldKeys([]);
        setParseWarnings([]);
        setParseError("");
        setParseCounts({});
        localStorage.removeItem(RESUME_FIELDS_STORAGE_KEY);
        localStorage.removeItem(RESUME_STRUCTURE_STORAGE_KEY);
        localStorage.removeItem(RESUME_PHOTO_STORAGE_KEY);
        localStorage.removeItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
        localStorage.removeItem(RESUME_PHOTO_REMOVED_STORAGE_KEY);
        localStorage.removeItem(`resume-counts-${templateId}`);
        setExperienceCount(1);
        setEducationCount(1);
    }, [readOnly, templateId]);

    const replaceFieldValues = useCallback((next) => {
        if (readOnly) return;
        setFieldValuesState(next);
        const cleaned = {};
        Object.entries(next).forEach(([k, v]) => {
            const u = String(v || "").replace(/\u00a0/g, " ").trim();
            if (u) cleaned[k] = u;
        });
        localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(cleaned));
    }, [readOnly]);

    const uploadResumeFile = useCallback(
        async (file) => {
            if (readOnly) return { success: false, error: "Режим только для чтения" };
            setParseError("");
            setParseWarnings([]);
            setIsParsingResume(true);
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("template_id", templateId);
                const response = await fetch("/api/resumes/parse", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const errorMessage = result?.error || result?.message || "Не удалось распознать резюме. Попробуйте еще раз.";
                    setParseError(errorMessage);
                    return { success: false, error: errorMessage };
                }

                const mappedData = result?.mappedData || {};
                const warnings = result?.warnings || [];
                const counts = result?.counts || {};

                if (!mappedData || typeof mappedData !== "object" || !Object.keys(mappedData).length) {
                    const errorMessage = "Сервер не вернул данных для заполнения полей.";
                    setParseError(errorMessage);
                    return { success: false, error: errorMessage };
                }

                setFieldValuesState((prev) => {
                    const next = { ...prev };
                    Object.entries(mappedData).forEach(([key, value]) => {
                        const cleaned = String(value ?? "").replace(/\u00a0/g, " ").trim();
                        if (cleaned) next[key] = cleaned;
                        else delete next[key];
                    });
                    const compact = {};
                    Object.entries(next).forEach(([k, v]) => {
                        const cleaned = String(v ?? "").replace(/\u00a0/g, " ").trim();
                        if (cleaned) compact[k] = cleaned;
                    });
                    localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(compact));
                    return next;
                });

                if (typeof counts.experience === "number") {
                    setExperienceCount(Math.max(1, counts.experience));
                }
                if (typeof counts.education === "number") {
                    setEducationCount(Math.max(1, counts.education));
                }
                setParseCounts(counts);
                localStorage.setItem(`resume-counts-${templateId}`, JSON.stringify(counts));

                setParsedFieldKeys(
                    Object.entries(mappedData)
                        .filter(([, value]) => String(value ?? "").trim())
                        .map(([key]) => key),
                );
                setParseWarnings(warnings);
                return { success: true, warnings, counts };
            } catch {
                const errorMessage = "Ошибка сети при загрузке файла. Проверьте подключение и повторите.";
                setParseError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsParsingResume(false);
            }
        },
        [readOnly, templateId],
    );

    const resetParsedFields = useCallback(() => {
        if (readOnly || !parsedFieldKeys.length) return;
        setFieldValuesState((prev) => {
            const next = { ...prev };
            parsedFieldKeys.forEach((key) => {
                delete next[key];
            });
            const compact = {};
            Object.entries(next).forEach(([k, v]) => {
                const cleaned = String(v ?? "").replace(/\u00a0/g, " ").trim();
                if (cleaned) compact[k] = cleaned;
            });
            localStorage.setItem(RESUME_FIELDS_STORAGE_KEY, JSON.stringify(compact));
            return next;
        });
        setParsedFieldKeys([]);
        setParseWarnings([]);
        setParseError("");
    }, [parsedFieldKeys, readOnly]);

    const saveToCabinet = useCallback(
        async (templateId, keys, structure, customTitle = null, isCopy = false) => {
            if (readOnly) return { ok: false, message: "Режим только для чтения" };

            const fields = {};
            keys.forEach((k) => {
                const v = String(fieldValues[k] ?? "").replace(/\u00a0/g, " ").trim();
                if (v) fields[k] = v;
            });

            if (!customTitle?.trim()) return { ok: false, message: "Название не указано" };
            const title = customTitle.trim();

            const targetId = (isCopy || !resumeId) ? null : resumeId;
            const url = targetId ? `/api/resumes/${targetId}` : "/api/resumes";
            const method = targetId ? "PUT" : "POST";

            try {
                const response = await fetch(url, {
                    method,
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        template_id: templateId,
                        title,
                        payload: { fields, structure, photo: photo || null },
                    }),
                });

                const result = await response.json().catch(() => ({}));
                if (response.ok) {
                    localStorage.removeItem(RESUME_PHOTO_REMOVED_STORAGE_KEY);
                    if (photo) {
                        localStorage.setItem(RESUME_PHOTO_SCOPE_STORAGE_KEY, photoStorageScope(result?.item?.id || resumeId));
                    } else {
                        localStorage.removeItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
                    }
                    const token = result?.item?.public_token || "";
                    if (token) setPublicToken(token);
                    if (!targetId && result?.item?.id) {
                        const next = new URLSearchParams(searchParams);
                        next.set("resumeId", String(result.item.id));
                        next.delete("blank");
                        setSearchParams(next, { replace: true });
                    }
                    return {
                        ok: true,
                        message: isCopy ? "Копия сохранена" : (targetId ? "Изменения сохранены" : "Шаблон сохранен в личный кабинет"),
                    };
                } else {
                    return { ok: false, message: result?.error || "Не удалось сохранить шаблон" };
                }
            } catch {
                return { ok: false, message: "Ошибка сети при сохранении" };
            }
        },
        [fieldValues, photo, readOnly, resumeId, searchParams, setSearchParams],
    );

    const publicUrl =
        !shareToken && readOnly && templateId && publicToken
            ? (() => {
                const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                return new URL(
                    `/templates/${templateId}?readonly=1&share=${encodeURIComponent(publicToken)}&embed=1`,
                    baseUrl,
                ).toString();
            })()
            : "";

    return {
        resumeId,
        blank,
        readOnly,
        embed,
        shareToken,
        publicToken,
        publicUrl,
        currentTitle,
        fieldValues,
        setField,
        replaceFieldValues,
        experienceCount,
        setExperienceCount,
        educationCount,
        setEducationCount,
        clearAllFields,
        uploadResumeFile,
        resetParsedFields,
        isParsingResume,
        parseWarnings,
        parseError,
        hasParsedData: parsedFieldKeys.length > 0,
        saveToCabinet,
        ready,
        searchParams,
        setSearchParams,
        photo,
        setPhoto: (newPhoto) => {
            if (readOnly) return;
            setPhotoState(newPhoto);
            if (newPhoto) {
                localStorage.setItem(RESUME_PHOTO_STORAGE_KEY, newPhoto);
                localStorage.setItem(RESUME_PHOTO_SCOPE_STORAGE_KEY, photoStorageScope(resumeId));
                localStorage.removeItem(RESUME_PHOTO_REMOVED_STORAGE_KEY);
            } else {
                localStorage.removeItem(RESUME_PHOTO_STORAGE_KEY);
                localStorage.removeItem(RESUME_PHOTO_SCOPE_STORAGE_KEY);
                localStorage.setItem(RESUME_PHOTO_REMOVED_STORAGE_KEY, photoStorageScope(resumeId));
            }
        },
        parseCounts,
    };
}