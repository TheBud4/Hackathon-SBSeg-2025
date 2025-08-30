import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="p-4 text-center">
      <h1 className="text-5xl font-bold text-red-600">404</h1>
      <p className="mt-2 text-xl">Página não encontrada.</p>
      <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">
        Voltar para a página inicial
      </Link>
    </div>
  );
}
