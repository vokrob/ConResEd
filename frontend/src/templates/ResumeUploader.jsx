import { useRef } from "react";

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function hasAllowedExtension(fileName) {
  const lowerName = String(fileName || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export function ResumeUploader({
  onUpload,
  onResetParsed,
  isLoading = false,
  warnings = [],
  error = "",
  hasParsedData = false,
}) {
  const inputRef = useRef(null);

  const runUpload = async (file) => {
    if (!file) return;
    if (!hasAllowedExtension(file.name)) {
      window.alert("Можно загрузить только файлы PDF или DOCX.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      window.alert("Файл слишком большой. Максимальный размер: 10MB.");
      return;
    }
    await onUpload(file);
  };

  const handleInputChange = async (event) => {
    const file = event.target.files?.[0];
    await runUpload(file);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    await runUpload(file);
  };

  return (
    <div className="resume-uploader">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
      <button
        type="button"
        className="resume-upload-btn"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
      >
        {isLoading ? "Анализируем файл..." : "Загрузить резюме"}
      </button>
      <div
        className={`resume-upload-dropzone ${isLoading ? "disabled" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        Перетащите сюда PDF/DOCX
      </div>
      {hasParsedData && (
        <button type="button" className="resume-reset-btn" onClick={onResetParsed} disabled={isLoading}>
          Сбросить распознанное
        </button>
      )}
      {!!error && <div className="resume-parse-error">{error}</div>}
      {!!warnings.length && (
        <div className="resume-parse-warnings">
          <strong>Обратите внимание:</strong>
          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
