import { Link } from "react-router-dom";

const IDS = ["classic", "modern", "creative", "professional"];
const LABELS = {
  classic: "Классический",
  modern: "Современный",
  creative: "Креативный",
  professional: "Профессиональный",
};

export function TemplateNav({ extraActions = null }) {
  return (
    <nav className="template-nav">
      <Link to="/">Главная</Link>
      {IDS.map((id) => (
        <Link key={id} to={`/templates/${id}`}>
          {LABELS[id]}
        </Link>
      ))}
      {extraActions}
    </nav>
  );
}
