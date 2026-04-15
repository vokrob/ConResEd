import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/** Максимум символов в одном поле ФИО (фамилия / имя / отчество). */
const FIO_MAX_LENGTH = 40;

function clampSingleLine(text, maxLen) {
  let v = String(text || "").replace(/\u00a0/g, " ");
  v = v.replace(/[\r\n]+/g, " ");
  return v.slice(0, maxLen);
}

function clampMultiline(text, maxLen) {
  const value = String(text || "").replace(/\u00a0/g, " ");
  if (!/[\r\n]/.test(value)) return value;
  const lines = value.split(/\r?\n/).map((line) => line.slice(0, maxLen));
  return lines.join("\n");
}

export function EditableField({
  fieldKey,
  value,
  onChange,
  placeholder,
  className = "",
  fio = false,
  multiline = true,
  maxLength,
}) {
  const [searchParams] = useSearchParams();
  const isReadOnly = searchParams.get("readonly") === "1";
  const ref = useRef(null);
  const ph = (placeholder || "").toLowerCase();
  const maxLine = fio
    ? FIO_MAX_LENGTH
    : typeof maxLength === "number"
      ? maxLength
      : ph.includes("навык")
        ? 160
        : 80;

  const singleLineMode = fio || typeof maxLength === "number" || !multiline;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raw = value ?? "";
    const next = singleLineMode ? clampSingleLine(raw, maxLine) : raw;
    if (el.innerText !== next) el.innerText = next;
  }, [value, fieldKey, singleLineMode, maxLine]);

  const applySingleLineBlur = () => {
    const el = ref.current;
    if (!el) return;
    let t = el.innerText.replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ");
    t = clampSingleLine(t, maxLine).trim();
    if (!t) {
      el.innerHTML = "";
      onChange(fieldKey, "");
    } else {
      if (el.innerText !== t) el.innerText = t;
      onChange(fieldKey, t);
    }
  };

  return (
    <span
      ref={ref}
      className={`editable-field ${fio ? "fio-field" : ""} ${className}`.trim()}
      data-placeholder={placeholder}
      contentEditable={!isReadOnly}
      suppressContentEditableWarning
      onInput={(e) => {
        if (isReadOnly) return;
        const el = e.currentTarget;
        let t = el.innerText.replace(/\u00a0/g, " ");
        if (singleLineMode) t = clampSingleLine(t, maxLine);
        else t = clampMultiline(t, maxLine);
        if (t !== el.innerText) el.innerText = t;
        onChange(fieldKey, t);
      }}
      onBlur={(e) => {
        if (isReadOnly) return;
        if (singleLineMode) {
          applySingleLineBlur();
          return;
        }
        const el = e.currentTarget;
        const t = el.innerText.trim();
        if (!t) el.innerHTML = "";
        onChange(fieldKey, t);
      }}
    />
  );
}
