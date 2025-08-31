import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  Search,
  Filter,
  SortDesc,
  Eye,
  AlertTriangle,
  Clock,
  Target,
  ExternalLink,
} from "lucide-react";

const VulnerabilitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("priority_score");
  const [sortOrder, setSortOrder] = useState("desc");
  const [allVulnerabilities, setAllVulnerabilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar assets para obter priority_score
        const assetsResponse = await axios.get("http://127.0.0.1:5000/assets");
        const assets = assetsResponse.data.assets || [];
        
        // Criar mapa de assets por name:version
        const assetsMap = {};
        assets.forEach(asset => {
          const key = `${asset.name}:${asset.version}`;
          assetsMap[key] = {
            priority_score: asset.priority_score,
            product: asset.product,
            vulnerabilities_count: asset.vulnerabilities_count
          };
        });
        
        console.log('Assets map criado:', Object.keys(assetsMap).length, 'entradas');
        console.log('Primeiras chaves do assets map:', Object.keys(assetsMap).slice(0, 3));
        
        // Buscar vulnerabilidades
        const vulnResponse = await axios.get("http://127.0.0.1:5000/vulnerabilities");
        const vulnerabilities = vulnResponse.data.vulnerabilities || [];
        
        // Mapear vulnerabilidades com priority_score dos assets
        const mappedVulnerabilities = vulnerabilities.map((vuln) => {
          // Buscar priority_score do asset correspondente
          let priorityScore = null;
          let assetInfo = null;
          
          if (vuln.component_name && vuln.component_version) {
            const key = `${vuln.component_name}:${vuln.component_version}`;
            if (assetsMap[key]) {
              priorityScore = assetsMap[key].priority_score;
              assetInfo = assetsMap[key];
            }
          }
          
          // Tentar mapeamento alternativo se o primeiro não funcionar
          if (priorityScore === null && vuln.component_name) {
            // Tentar apenas com o nome do componente
            const matchingKeys = Object.keys(assetsMap).filter(k => k.startsWith(vuln.component_name));
            if (matchingKeys.length === 1) {
              priorityScore = assetsMap[matchingKeys[0]].priority_score;
              assetInfo = assetsMap[matchingKeys[0]];
            }
          }
          
          return {
            _id: vuln.id,
            cve_id: vuln.vulnerability_ids,
            title: vuln.title,
            description: vuln.description,
            severity: vuln.severity ? vuln.severity.toUpperCase() : "UNKNOWN",
            status: mapStatus(vuln),
            cvss_score: vuln.cvssv3_score ? parseFloat(vuln.cvssv3_score) : 0,
            priority_score: priorityScore,
            asset_info: assetInfo,
            createdAt: vuln.created,
            assignee: vuln.last_reviewed_by,
            affected_systems: vuln.component_name && vuln.component_version ? [`${vuln.component_name}:${vuln.component_version}`] : [],
            component_name: vuln.component_name,
            component_version: vuln.component_version,
          };
        });
        
        console.log('Assets carregados:', assets.length);
        console.log('Vulnerabilidades mapeadas:', mappedVulnerabilities.length);
        console.log('Primeira vulnerabilidade:', mappedVulnerabilities[0]);
        
        // Estatísticas de mapeamento
        const mappedCount = mappedVulnerabilities.filter(v => v.priority_score !== null).length;
        const unmappedCount = mappedVulnerabilities.filter(v => v.priority_score === null).length;
        console.log(`Mapeamento: ${mappedCount} com priority_score, ${unmappedCount} sem priority_score`);
        
        // Mostrar algumas vulnerabilidades sem mapeamento para debug
        const unmappedExamples = mappedVulnerabilities
          .filter(v => v.priority_score === null)
          .slice(0, 3)
          .map(v => ({
            cve: v.cve_id,
            component: `${v.component_name}:${v.component_version}`
          }));
        if (unmappedExamples.length > 0) {
          console.log('Exemplos de vulnerabilidades não mapeadas:', unmappedExamples);
        }
        
        setAllVulnerabilities(mappedVulnerabilities);
      } catch (err) {
        setError(err.message || "Erro ao buscar dados");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const mapStatus = (vuln) => {
    if (vuln.is_mitigated === "True") return "RESOLVED";
    if (vuln.active === "True") return "NEW";
    if (vuln.under_review === "True") return "ANALYZING";
    return "DISMISSED";
  };
  const filteredVulnerabilities = useMemo(() => {
    let filtered = allVulnerabilities.filter((vuln) => {
      const matchesSearch =
        !searchTerm ||
        vuln.cve_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity =
        severityFilter === "ALL" || vuln.severity === severityFilter;
      const matchesStatus =
        statusFilter === "ALL" || vuln.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "priority_score":
          aValue = a.priority_score;
          bValue = b.priority_score;
          break;
        case "cvss_score":
          aValue = a.cvss_score;
          bValue = b.cvss_score;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allVulnerabilities, searchTerm, severityFilter, statusFilter, sortBy, sortOrder]);

  // Paginação
  const paginatedVulnerabilities = useMemo(() => {
    return filteredVulnerabilities.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredVulnerabilities, currentPage]);

  const totalPages = Math.ceil(filteredVulnerabilities.length / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter, statusFilter]);

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "UNKNOWN":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "ANALYZING":
        return "bg-purple-100 text-purple-800";
      case "PRIORITIZED":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "DISMISSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 90) return "text-red-600 font-bold";
    if (score >= 70) return "text-orange-600 font-semibold";
    if (score >= 50) return "text-yellow-600 font-medium";
    return "text-green-600";
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erro ao carregar vulnerabilidades
          </h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vulnerabilidades</h1>
          <p className="text-gray-600 mt-2">
            {filteredVulnerabilities.length} vulnerabilidades encontradas
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar CVE, título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Severidade */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="ALL">Todas as Severidades</option>
              <option value="CRITICAL">Crítica</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>

          {/* Filtro de Status */}
          <div className="relative">
            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="NEW">Nova</option>
              <option value="ANALYZING">Analisando</option>
              <option value="PRIORITIZED">Priorizada</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="RESOLVED">Resolvida</option>
              <option value="DISMISSED">Descartada</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="relative">
            <SortDesc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="priority_score-desc">Prioridade (Maior)</option>
              <option value="priority_score-asc">Prioridade (Menor)</option>
              <option value="cvss_score-desc">CVSS (Maior)</option>
              <option value="cvss_score-asc">CVSS (Menor)</option>
              <option value="createdAt-desc">Mais Recente</option>
              <option value="createdAt-asc">Mais Antigo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Vulnerabilidades */}
      <div className="space-y-4">
        {paginatedVulnerabilities.map((vuln) => (
          <div
            key={vuln._id}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vuln.cve_id}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                      vuln.severity || ""
                    )}`}
                  >
                    {vuln.severity}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      vuln.status || ""
                    )}`}
                  >
                    {vuln.status?.replace("_", " ")}
                  </span>
                </div>

                <h4 className="text-md font-medium text-gray-800 mb-2">
                  {vuln.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {vuln.description}
                </p>

                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>CVSS: {vuln.cvss_score}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(vuln.createdAt).toLocaleDateString()}</span>
                  </div>
                  {vuln.assignee && (
                    <div>
                      <span>Responsável: {vuln.assignee}</span>
                    </div>
                  )}
                </div>

                {/* Sistemas Afetados */}
                {vuln.affected_systems && vuln.affected_systems.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Sistemas Afetados:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {vuln.affected_systems
                        .slice(0, 3)
                        .map((system, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {system}
                          </span>
                        ))}
                      {vuln.affected_systems.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">
                          +{vuln.affected_systems.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações do Asset */}
                {vuln.asset_info && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Informações do Asset:</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Produto:</span>
                        <span className="ml-1 font-medium">{vuln.asset_info.product}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vulns no Asset:</span>
                        <span className="ml-1 font-medium">{vuln.asset_info.vulnerabilities_count}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end space-y-3 ml-6">
                {/* Score de Prioridade */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Priority Score</p>
                  {typeof vuln.priority_score === 'number' && vuln.priority_score > 0 ? (
                    <div>
                      <p
                        className={`text-2xl font-bold ${getPriorityColor(
                          vuln.priority_score
                        )}`}
                      >
                        {vuln.priority_score.toFixed(1)}
                      </p>
                      {vuln.asset_info && (
                        <p className="text-xs text-gray-500 mt-1">
                          {vuln.asset_info.product}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-400 italic">
                        Sem dados
                      </p>
                      {vuln.component_name && (
                        <p className="text-xs text-gray-400 mt-1">
                          {vuln.component_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <Link
                    to={`/vulnerabilidades/${vuln._id}`}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Detalhes</span>
                  </Link>

                  {vuln.cve_id && (
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">NVD</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {paginatedVulnerabilities.length === 0 && filteredVulnerabilities.length > 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma vulnerabilidade encontrada nesta página
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        )}

        {filteredVulnerabilities.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma vulnerabilidade encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        )}

        {/* Paginação */}
        {filteredVulnerabilities.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-700">
              Página <span className="font-semibold">{currentPage}</span> de{" "}
              <span className="font-semibold">{totalPages}</span> (
              {filteredVulnerabilities.length} vulnerabilidades)
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
        )}
      </div>
    </div>
  );
};

export default VulnerabilitiesPage;
