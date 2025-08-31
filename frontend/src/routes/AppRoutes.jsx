import { Routes, Route } from "react-router";

// Importando suas páginas
import NotFoundPage from "../pages/NotFoundPage";
import HomePage from "../pages/HomePage";
import InsertJsonPage from "../pages/InsertJson";
import VulnerabilitiesPage from "../pages/VilnerabilitiesPage";
import VulnerabilityDetail from "../pages/Vulnerabilitie";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/inserir-json" element={<InsertJsonPage />} />
      <Route path="/vulnerabilidades" element={<VulnerabilitiesPage />} />
      <Route path="/vulnerabilidades/:id" element={<VulnerabilityDetail />} />


      {/* Rota "catch-all" para páginas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
