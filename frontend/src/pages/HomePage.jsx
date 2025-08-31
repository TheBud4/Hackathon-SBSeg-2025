// HomePage.js - Versão com Agregação de Dados no Frontend
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Activity, RefreshCw } from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";

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
      <p className="text-center text-gray-500 mt-4">
        Carregando todos os dados. Isso pode levar um momento...
      </p>
    </div>
  </div>
);

const HomePage = () => {
  const [trendData, setTrendData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const response = await axios.get("/api/trend");
        setTrendData(response.data);
        setErrorMessage(null);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setErrorMessage("Erro ao buscar dados.");
      }
    };
    fetchTrend();
  }, []);

  // --- ESTADO ---
  // NOVO: Estado para armazenar TODOS os ativos após buscar todas as páginas
  const [allAssets, setAllAssets] = useState([]);

  // MODIFICADO: 'loading' agora representa a busca inicial completa
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para controle da tabela e modal (permanecem os mesmos)
  const [sortKey, setSortKey] = useState("priority_score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // --- LÓGICA DE BUSCA DE DADOS MODIFICADA ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Faz a primeira chamada para pegar a paginação e os primeiros ativos
        const initialResponse = await axios.get(
          `http://localhost:5000/assets?page=1&per_page=${ITEMS_PER_PAGE}`
        );
        const firstPageAssets = initialResponse.data.assets;
        const totalPages = initialResponse.data.pagination.pages;

        // Se houver mais de uma página, busca as restantes
        if (totalPages > 1) {
          // 2. Cria um array de promessas para as páginas restantes
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(
              axios.get(
                `http://localhost:5000/assets?page=${page}&per_page=${ITEMS_PER_PAGE}`
              )
            );
          }

          // 3. Executa todas as chamadas em paralelo
          const remainingResponses = await Promise.all(pagePromises);
          const remainingAssets = remainingResponses.flatMap(
            (res) => res.data.assets
          );

          // 4. Combina tudo e atualiza o estado
          setAllAssets([...firstPageAssets, ...remainingAssets]);
        } else {
          setAllAssets(firstPageAssets);
        }
      } catch (err) {
        setError("Falha ao carregar dados do backend.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []); // Executa apenas uma vez ao montar o componente

  // Função de buscar detalhes do ativo (permanece a mesma)
  const fetchAssetDetails = async (assetId) => {
    /* ... */
    setDetailsLoading(true);
    try {
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

  // --- HANDLERS ---
  const handleRefresh = () => {
    window.location.reload();
  }; // A forma mais simples de recarregar tudo
  const handlePageChange = (page) => {
    setCurrentPage(page);
  }; // Agora apenas muda o estado local
  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    fetchAssetDetails(asset.id);
  };
  const handleCloseDetails = () => {
    setSelectedAsset(null);
    setAssetDetails(null);
  };
  const handleSort = (key) => {
    /* ... */
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // --- PROCESSAMENTO DE DADOS (AGORA USANDO 'allAssets') ---

  // 1. Métricas para os Cards (calculado sobre todos os dados)
  const metrics = useMemo(() => {
    if (!allAssets || allAssets.length === 0)
      return { total: 0, critical: 0, high: 0, avgPriority: 0 };

    const critical = allAssets.filter((a) => a.priority_score >= 90).length;
    const high = allAssets.filter(
      (a) => a.priority_score >= 70 && a.priority_score < 90
    ).length;
    const avgPriority =
      allAssets.reduce((acc, v) => acc + (v.priority_score || 0), 0) /
      allAssets.length;

    return {
      total: allAssets.length,
      critical,
      high,
      avgPriority: Math.round(avgPriority * 10) / 10,
    };
  }, [allAssets]);

  const barChartData = useMemo(() => {
    // 1. Agrupa os dados e calcula a soma e a contagem para cada produto
    const groupedData = allAssets.reduce((acc, asset) => {
      if (!acc[asset.product]) {
        acc[asset.product] = { totalScore: 0, count: 0 };
      }
      acc[asset.product].totalScore += asset.priority_score;
      acc[asset.product].count += 1;
      return acc;
    }, {});

    // 2. Calcula a média para cada produto
    const productsWithAverage = Object.keys(groupedData).map((product) => ({
      product,
      averagePriority:
        groupedData[product].totalScore / groupedData[product].count,
    }));

    // 3. Ordena os produtos pela maior média (descendente) e pega o Top 10
    return productsWithAverage
      .sort((a, b) => b.averagePriority - a.averagePriority)
      .slice(0, 10);
  }, [allAssets]);

  const pieData = useMemo(() => {
    // ... (esta parte não muda)
    const severityData = allAssets.reduce((acc, asset) => {
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
  }, [allAssets]);

  // NOVO: Paginação e Ordenação feitas no Frontend
  const paginatedAndSortedAssets = useMemo(() => {
    return [...allAssets]
      .sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [allAssets, sortKey, sortDirection, currentPage]);

  const PIE_COLORS = { Alto: "#dc2626", Médio: "#ca8a04", Baixo: "#16a34a" };
  const totalPages = Math.ceil(allAssets.length / ITEMS_PER_PAGE);

  // --- RENDERIZAÇÃO ---
  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (loading) return <p>Carregando tendências...</p>;
  if (errorMessage) return <p className="text-red-600">{errorMessage}</p>;
  if (!trendData || trendData.length === 0)
    return <p>Nenhuma tendência disponível.</p>;

  const chartData = trendData.map((f) => ({ date: f.ds, value: f.yhat }));

  const first = trendData[0].yhat;
  const last = trendData[trendData.length - 1].yhat;
  const percentual = (((last - first) / Math.abs(first || 1)) * 100).toFixed(2);
  let analise = "Tendência estável.";
  if (percentual > 5)
    analise = `A tendência é crescer ${percentual}% nos próximos dias.`;
  if (percentual < -5)
    analise = `A tendência é cair ${Math.abs(percentual)}% nos próximos dias.`;

  return (
    <div className="p-6 space-y-8">
      {/* Header e Cards usam 'metrics', que agora são globais */}
      {/* ... (o JSX do header e dos cards não muda) ... */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            SPV - Dashboard
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
            {loading ? "Atualizando..." : "Recarregar"}
          </button>
        </div>
      </div>
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
      {/* Gráficos usam dados calculados de 'allAssets' */}
      {/* ... (o JSX dos gráficos não muda) ... */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 card">
          <h3 className="text-lg font-semibold mb-4">
            Top 10 Produtos por Média de Score
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            {/* MODIFICADO: Adicionada margem inferior para os rótulos angulados */}
            <BarChart
              data={barChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              {/* MODIFICADO: Rótulos do eixo X agora estão na diagonal */}
              <XAxis
                dataKey="product"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averagePriority" name="Prioridade Média">
                {/* NOVO: Lógica para colorir cada barra individualmente */}
                {barChartData.map((entry, index) => {
                  const priority =
                    entry.averagePriority > 70
                      ? "Alto"
                      : entry.averagePriority > 40
                      ? "Médio"
                      : "Baixo";
                  return (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[priority]} />
                  );
                })}
              </Bar>
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
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">
          Tendência de Vulnerabilidades Críticas
        </h1>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ff0000"
              name="Previsão"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="p-4 bg-gray-100 rounded-lg">
          <p>{analise}</p>
        </div>
      </div>

      {/* Tabela agora mapeia 'paginatedAndSortedAssets' */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Visão Geral dos Ativos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            {/* ...cabeçalho da tabela... */}
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
              {paginatedAndSortedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  {/* ...células da tabela... */}
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
        {/* MODIFICADO: Paginação usa estado local */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-700">
            Página <span className="font-semibold">{currentPage}</span> de{" "}
            <span className="font-semibold">{totalPages}</span> (
            {allAssets.length} ativos)
          </span>
          <div className="inline-flex mt-2 xs:mt-0">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900 disabled:bg-gray-400"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border-0 border-l border-gray-700 rounded-r hover:bg-gray-900 disabled:bg-gray-400"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Modal permanece o mesmo */}
      {selectedAsset && assetDetails && (
        // ...código do modal...
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
