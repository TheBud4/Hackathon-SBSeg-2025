// HomePage.js - Versão Integrada

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Componente para o esqueleto de carregamento (mantido do seu código original)
const LoadingSkeleton = () => (
  <div className="p-6">
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

const HomePage = () => {
  // --- ESTADO UNIFICADO (LÓGICA DO App.js) ---
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("priority_score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // --- FUNÇÕES DE BUSCA DE DADOS (LÓGICA DO App.js) ---
  const fetchAssets = async (page = 1) => {
    setLoading(true);
    setError(null); // Limpa erros anteriores
    try {
      const response = await axios.get(
        `http://localhost:5000/assets?page=${page}&per_page=10`
      );
      setAssets(response.data.assets);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError("Falha ao carregar dados do backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetDetails = async (assetId) => {
    setDetailsLoading(true);
    try {
      // A paginação no detalhe pode não ser necessária, removido por simplicidade
      const response = await axios.get(
        `http://localhost:5000/assets/${assetId}`
      );
      setAssetDetails(response.data);
    } catch (err) {
      console.error("Falha ao carregar detalhes do ativo:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(1); // Carrega a primeira página ao montar o componente
  }, []);

  // --- HANDLERS DE INTERAÇÃO (LÓGICA DO App.js) ---
  const handleRefresh = () => fetchAssets(currentPage);
  const handlePageChange = (page) => fetchAssets(page);
  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    fetchAssetDetails(asset.id);
  };
  const handleCloseDetails = () => {
    setSelectedAsset(null);
    setAssetDetails(null);
  };
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // --- PROCESSAMENTO DE DADOS PARA GRÁFICOS E MÉTRICAS (LÓGICA DO App.js ADAPTADA) ---

  // 1. Métricas para os Cards
  const metrics = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { total: 0, critical: 0, high: 0, avgPriority: 0 };
    }
    const total = pagination.total || assets.length; // Usa o total da paginação se disponível
    const critical = assets.filter((a) => a.priority_score >= 90).length;
    const high = assets.filter(
      (a) => a.priority_score >= 70 && a.priority_score < 90
    ).length;
    const avgPriority =
      assets.reduce((acc, v) => acc + (v.priority_score || 0), 0) /
      assets.length;
    return {
      total,
      critical,
      high,
      avgPriority: Math.round(avgPriority * 10) / 10,
    };
  }, [assets, pagination]);

  // 2. Dados para o Gráfico de Barras
  const barChartData = useMemo(() => {
    const groupedData = assets.reduce((acc, asset) => {
      if (!acc[asset.product]) {
        acc[asset.product] = { totalScore: 0, count: 0 };
      }
      acc[asset.product].totalScore += asset.priority_score;
      acc[asset.product].count += 1;
      return acc;
    }, {});
    return Object.keys(groupedData).map((product) => ({
      product,
      averagePriority:
        groupedData[product].totalScore / groupedData[product].count,
    }));
  }, [assets]);

  // 3. Dados para o Gráfico de Pizza
  const pieData = useMemo(() => {
    const severityData = assets.reduce((acc, asset) => {
      const severity =
        asset.priority_score > 70
          ? "Alto"
          : asset.priority_score > 40
          ? "Médio"
          : "Baixo";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(severityData).map((key) => ({
      name: key,
      value: severityData[key],
    }));
  }, [assets]);

  const PIE_COLORS = { Alto: "#dc2626", Médio: "#ca8a04", Baixo: "#16a34a" };

  // 4. Ordenação dos Ativos para a Tabela
  const sortedAssets = useMemo(
    () =>
      [...assets].sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }),
    [assets, sortKey, sortDirection]
  );

  // --- RENDERIZAÇÃO ---
  if (loading && currentPage === 1) return <LoadingSkeleton />;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            BluePriori Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral da segurança e análise de ativos
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Sistema Ativo</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
          <p className="text-red-100 text-sm font-medium">
            Ativos Críticos (Score &gt; 90)
          </p>
          <p className="text-3xl font-bold">{metrics.critical}</p>
        </div>
        <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <p className="text-orange-100 text-sm font-medium">
            Ativos de Alta Prioridade
          </p>
          <p className="text-3xl font-bold">{metrics.high}</p>
        </div>
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm font-medium">Total de Ativos</p>
          <p className="text-3xl font-bold">{metrics.total}</p>
        </div>
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100 text-sm font-medium">
            Score Médio de Prioridade
          </p>
          <p className="text-3xl font-bold">{metrics.avgPriority}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 card">
          <h3 className="text-lg font-semibold mb-4">
            Média de Score por Produto
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="averagePriority"
                name="Prioridade Média"
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Risco</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Ativos */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Visão Geral dos Ativos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                {[
                  "name",
                  "version",
                  "product",
                  "priority_score",
                  "vulnerabilities_count",
                ].map((key) => (
                  <th
                    key={key}
                    scope="col"
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(key)}
                  >
                    {key.replace("_", " ")}{" "}
                    {sortKey === key && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                ))}
                <th scope="col" className="px-6 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4">{asset.version}</td>
                  <td className="px-6 py-4">{asset.product}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        asset.priority_score > 70
                          ? "bg-red-100 text-red-800"
                          : asset.priority_score > 40
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {asset.priority_score.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {asset.vulnerabilities_count}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleAssetClick(asset)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-700">
            Página <span className="font-semibold">{pagination.page}</span> de{" "}
            <span className="font-semibold">{pagination.pages}</span> (
            {pagination.total} ativos)
          </span>
          <div className="inline-flex mt-2 xs:mt-0">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.has_prev}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900 disabled:bg-gray-400"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.has_next}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border-0 border-l border-gray-700 rounded-r hover:bg-gray-900 disabled:bg-gray-400"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes (Estilizado com Tailwind) */}
      {selectedAsset && assetDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50"
          onClick={handleCloseDetails}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-4 border-b rounded-t">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedAsset.name} - Vulnerabilidades
              </h3>
              <button
                onClick={handleCloseDetails}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {detailsLoading ? (
                <p>Carregando vulnerabilidades...</p>
              ) : (
                assetDetails.vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-600">
                        {vuln.id}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          vuln.severity === "CRITICAL"
                            ? "bg-red-200 text-red-800"
                            : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {vuln.severity}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">
                      {vuln.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {vuln.description}
                    </p>
                    {vuln.cvssv3_score && (
                      <p className="text-sm font-mono mt-2">
                        CVSS Score: {vuln.cvssv3_score}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
