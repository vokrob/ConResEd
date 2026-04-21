import { Navigate, useParams } from "react-router-dom";
import ClassicTemplate from "./ClassicTemplate.jsx";
import CreativeTemplate from "./CreativeTemplate.jsx";
import ModernTemplate from "./ModernTemplate.jsx";
import ProfessionalTemplate from "./ProfessionalTemplate.jsx";
import ItTemplate from "./ItTemplate.jsx";

const TEMPLATES = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  creative: CreativeTemplate,
  professional: ProfessionalTemplate,
  it: ItTemplate,
};

export default function ResumeTemplateRoute() {
  const { templateId } = useParams();
  const Cmp = TEMPLATES[templateId];
  if (!Cmp) {
    return <Navigate to="/" replace />;
  }
  return <Cmp />;
}
