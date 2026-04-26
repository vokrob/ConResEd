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
  const lastValidValueRef = useRef(value);
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
    lastValidValueRef.current = next;
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
    lastValidValueRef.current = t;
  };

  const handleFioInput = (e) => {
    const el = e.currentTarget;
    let newText = el.innerText.replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ");
    if (newText.length > maxLine) {
      // Если превышен лимит – восстанавливаем последнее валидное значение
      el.innerText = lastValidValueRef.current || "";
      // Перемещаем курсор в конец
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    // Обрезаем до лимита (на случай вставки длинного текста)
    if (newText.length > maxLine) {
      newText = newText.slice(0, maxLine);
    }
    newText = clampSingleLine(newText, maxLine);
    if (el.innerText !== newText) el.innerText = newText;
    lastValidValueRef.current = newText;
    onChange(fieldKey, newText);
  };

  const handleMultilineInput = (e) => {
    const el = e.currentTarget;
    let newText = el.innerText.replace(/\u00a0/g, " ");
    newText = clampMultiline(newText, maxLine);
    if (el.innerText !== newText) el.innerText = newText;
    onChange(fieldKey, newText);
    lastValidValueRef.current = newText;
  };

  // Универсальная обработка вставки для всех полей
  const handlePaste = (e) => {
    e.preventDefault();
    // Получаем обычный текст из буфера обмена
    let pastedText = e.clipboardData.getData("text/plain");
    if (pastedText === undefined || pastedText === null) return;

    // Для полей ФИО: заменяем переносы на пробелы и обрезаем
    if (fio) {
      pastedText = pastedText.replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ");
      if (pastedText.length > maxLine) {
        pastedText = pastedText.slice(0, maxLine);
      }
      pastedText = clampSingleLine(pastedText, maxLine);
    } else if (singleLineMode) {
      // Для однострочных полей (например, период работы)
      pastedText = pastedText.replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ");
      if (pastedText.length > maxLine) {
        pastedText = pastedText.slice(0, maxLine);
      }
      pastedText = clampSingleLine(pastedText, maxLine);
    } else {
      // Для многострочных полей
      if (pastedText.length > maxLine) {
        pastedText = pastedText.slice(0, maxLine);
      }
      pastedText = clampMultiline(pastedText, maxLine);
    }

    // Вставляем очищенный текст
    document.execCommand("insertText", false, pastedText);
    // Вызываем onChange с новым значением
    const el = ref.current;
    if (el) {
      const newText = el.innerText.replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ");
      onChange(fieldKey, newText);
      lastValidValueRef.current = newText;
    }
  };

  return (
    <span
      ref={ref}
      className={`editable-field ${fio ? "fio-field" : ""} ${className}`.trim()}
      data-placeholder={placeholder}
      contentEditable={!isReadOnly}
      suppressContentEditableWarning
      onPaste={handlePaste}
      onInput={(e) => {
        if (isReadOnly) return;
        if (fio) {
          handleFioInput(e);
        } else if (singleLineMode) {
          const el = e.currentTarget;
          let newText = el.innerText.replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ");
          if (newText.length > maxLine) {
            newText = newText.slice(0, maxLine);
          }
          newText = clampSingleLine(newText, maxLine);
          if (el.innerText !== newText) el.innerText = newText;
          onChange(fieldKey, newText);
          lastValidValueRef.current = newText;
        } else {
          handleMultilineInput(e);
        }
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
        lastValidValueRef.current = t;
      }}
    />
  );
}