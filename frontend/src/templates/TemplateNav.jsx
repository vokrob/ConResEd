import { Link } from "react-router-dom";

const IDS = ["classic", "modern", "creative", "professional", "it"];
const LABELS = {
  classic: "Классический",
  modern: "Современный",
  creative: "Креативный",
  professional: "Профессиональный",
  it: "IT Специалист",
};

export function TemplateNav({ extraActions = null, onNavigateHome = null }) {
  const handleHomeClick = (e) => {
    if (onNavigateHome) {
      e.preventDefault();
      onNavigateHome();
    }
  };

  return (
    <nav className="template-nav">
      <Link to="/" onClick={handleHomeClick}>Главная</Link>
      {IDS.map((id) => (
        <Link key={id} to={`/templates/${id}`}>
          {LABELS[id]}
        </Link>
      ))}
      {extraActions}
    </nav>
  );
}