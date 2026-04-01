import { useEffect, useMemo, useState } from "react";
import parseResumeData from "./parseResumeData";

const API_BASE_URL = "/api";

function compactLines(text) {
  const source = (text || "").toString();
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PublicResume({ publicId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resume, setResume] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/public/resumes/${encodeURIComponent(publicId)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить резюме");
        }
        if (!cancelled) setResume(data.resume);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (publicId) run();
    else {
      setLoading(false);
      setError("Некорректная ссылка");
    }

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const view = useMemo(() => {
    if (!resume) return null;
    return parseResumeData(resume.data || {});
  }, [resume]);

  if (loading) {
    return (
      <div className="public-page">
        <div className="public-shell">
          <div className="public-loading">
            <div className="loading-spinner" role="status" aria-label="Загрузка" />
            <span>Загрузка резюме…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-page">
        <div className="public-shell">
          <div className="public-error">
            <h1>ConResEd</h1>
            <p>{error}</p>
            <a className="public-link" href="/">
              На главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!view) return null;

  const { fullName, position, about, contacts, experience, education, skills } = view;
  const aboutLines = compactLines(about);

  return (
    <div className="public-page">
      <div className="public-shell">
        <header className="public-hero">
          <div className="public-title">
            <h1>{fullName || "Резюме"}</h1>
            {position ? <p className="public-role">{position}</p> : null}
          </div>

          <div className="public-chips">
            {contacts.city ? <span className="chip">{contacts.city}</span> : null}
            {contacts.email ? (
              <a className="chip chip-link" href={`mailto:${contacts.email}`}>
                {contacts.email}
              </a>
            ) : null}
            {contacts.phone ? (
              <a className="chip chip-link" href={`tel:${contacts.phone}`}>
                {contacts.phone}
              </a>
            ) : null}
          </div>
        </header>

        {aboutLines.length ? (
          <section className="public-card">
            <h2>О себе</h2>
            <div className="public-text">
              {aboutLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ) : null}

        {experience.length ? (
          <section className="public-card">
            <h2>Опыт</h2>
            <div className="public-list">
              {experience.map((item, idx) => (
                <article key={`${idx}-${item.company}-${item.position}`} className="public-item">
                  <div className="public-item-head">
                    <div className="public-item-title">
                      <strong>{item.position || "Должность"}</strong>
                      {item.company ? <span className="muted"> · {item.company}</span> : null}
                    </div>
                    {item.period ? <div className="muted">{item.period}</div> : null}
                  </div>
                  {item.description ? <p className="public-text">{item.description}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {skills.length ? (
          <section className="public-card">
            <h2>Навыки</h2>
            <div className="public-chips">
              {skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {education.length ? (
          <section className="public-card">
            <h2>Образование</h2>
            <div className="public-list">
              {education.map((item, idx) => (
                <article key={`${idx}-${item.place}-${item.degree}`} className="public-item">
                  <div className="public-item-head">
                    <div className="public-item-title">
                      <strong>{item.degree || "Образование"}</strong>
                      {item.place ? <span className="muted"> · {item.place}</span> : null}
                    </div>
                    {item.year ? <div className="muted">{item.year}</div> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="public-footer">
          <span className="muted">Сделано в ConResEd</span>
          <a className="public-link" href="/">
            Открыть редактор
          </a>
        </footer>
      </div>
    </div>
  );
}

