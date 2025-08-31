import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import axios from "axios";
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  Target,
  Clock,
  ExternalLink,
  Eye,
  Server,
  TrendingUp,
  CheckCircle,
  User,
  Activity,
} from "lucide-react";

const VulnerabilityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vulnerability, setVulnerability] = useState(null);
  const [assetInfo, setAssetInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVulnerabilityDetail = async () => {
      try {
        setIsLoading(true);

        // Buscar vulnerabilidades para encontrar a específica
        const vulnResponse = await axios.get("http://127.0.0.1:5000/vulnerabilities");
        const vulnerabilities = vulnResponse.data.vulnerabilities || [];

        // Tentar diferentes formas de matching
        let vuln = vulnerabilities.find(v => v.id === id);

        if (!vuln) {
          vuln = vulnerabilities.find(v => String(v.id) === String(id));
        }

        if (!vuln) {
          vuln = vulnerabilities.find(v => v._id === id);
        }

        if (!vuln) {
          vuln = vulnerabilities.find(v => String(v._id) === String(id));
        }

        // Encontrar a vulnerabilidade específica
        if (!vuln) {
          throw new Error('Vulnerabilidade não encontrada');
        }

        // Buscar assets para obter informações adicionais
        const assetsResponse = await axios.get("http://127.0.0.1:5000/assets");
        const assets = assetsResponse.data.assets || [];

        // Tentar encontrar asset relacionado
        let relatedAsset = null;
        if (vuln.component_name) {
          relatedAsset = assets.find(asset => asset.name === vuln.component_name);
        }

        // Mapear dados da vulnerabilidade
        const mappedVulnerability = {
          _id: vuln.id,
          cve_id: vuln.vulnerability_ids,
          title: vuln.title || vuln.description?.split('.')[0] || `Vulnerabilidade ${vuln.vulnerability_ids}`,
          description: vuln.description,
          severity: vuln.severity ? vuln.severity.toUpperCase() : "UNKNOWN",
          status: mapStatus(vuln),
          cvss_score: vuln.cvssv3_score ? parseFloat(vuln.cvssv3_score) : 0,
          priority_score: relatedAsset ? relatedAsset.priority_score : null,
          createdAt: vuln.created,
          assignee: vuln.last_reviewed_by,
          affected_systems: vuln.component_name && vuln.component_version ? [`${vuln.component_name}:${vuln.component_version}`] : [],
          component_name: vuln.component_name,
          component_version: vuln.component_version,
          mitigation: vuln.mitigation,
          references: vuln.references,
          cwe: vuln.cwe,
          impact: vuln.impact,
          file_path: vuln.file_path,
          updatedAt: vuln.last_status_update || vuln.created,
        };

        setVulnerability(mappedVulnerability);
        setAssetInfo(relatedAsset);

      } catch (err) {
        setError(err.message || "Erro ao buscar vulnerabilidade");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchVulnerabilityDetail();
    }
  }, [id]);

  const mapStatus = (vuln) => {
    if (vuln.is_mitigated === "True") return "RESOLVED";
    if (vuln.active === "True") return "NEW";
    if (vuln.under_review === "True") return "ANALYZING";
    return "DISMISSED";
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'ANALYZING': return 'bg-purple-100 text-purple-800'
      case 'PRIORITIZED': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'DISMISSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 90) return 'text-red-600'
    if (score >= 70) return 'text-orange-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
  };

  const getRiskLevel = (score) => {
    if (score >= 90) return { level: 'CRÍTICO', color: 'bg-red-500' }
    if (score >= 70) return { level: 'ALTO', color: 'bg-orange-500' }
    if (score >= 50) return { level: 'MÉDIO', color: 'bg-yellow-500' }
    return { level: 'BAIXO', color: 'bg-green-500' }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar vulnerabilidade</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link
            to="/vulnerabilidades"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à Lista</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vulnerability) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vulnerabilidade não encontrada</h3>
          <p className="text-gray-500 mb-4">A vulnerabilidade solicitada não existe ou foi removida.</p>
          <Link
            to="/vulnerabilidades"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à Lista</span>
          </Link>
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(vulnerability.priority_score || 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vulnerabilidades')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{vulnerability.cve_id || "Não informado"}</h1>
            <p className="text-gray-600 mt-1">{vulnerability.title || "Não informado"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/vulnerabilidades`}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Eye className="h-4 w-4" />
            <span>Voltar à Lista</span>
          </Link>
        </div>
      </div>

      {/* Status e Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Severidade</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getSeverityColor(vulnerability.severity || '')}`}>
                {vulnerability.severity || "Não informado"}
              </span>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(vulnerability.status || '')}`}>
                {vulnerability.status?.replace('_', ' ') || "Não informado"}
              </span>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Score CVSS</p>
              <p className="text-2xl font-bold text-gray-900">{vulnerability.cvss_score || "Não informado"}</p>
            </div>
            <Shield className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Prioridade ML</p>
              <p className={`text-2xl font-bold ${getPriorityColor(vulnerability.priority_score || 0)}`}>
                {vulnerability.priority_score?.toFixed(1) || "Não informado"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Descrição</h3>
            <p className="text-gray-700 leading-relaxed">{vulnerability.description || "Não informado"}</p>
          </div>

          {/* Análise de Risco */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Análise de Risco</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-4 h-4 rounded-full ${riskLevel.color}`}></div>
                  <span className="font-medium">Nível de Risco: {riskLevel.level}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Métricas de Threat Intelligence</h4>
                <div className="space-y-3">
                  {vulnerability.cvss_score > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CVSS Score:</span>
                      <span className="text-sm font-medium">{vulnerability.cvss_score}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sistemas Afetados */}
          {vulnerability.affected_systems && vulnerability.affected_systems.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Sistemas Afetados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vulnerability.affected_systems.map((system, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Server className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">{system}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

                    {/* Detalhes Técnicos */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Detalhes Técnicos</h3>
            <div className="space-y-3">
              {vulnerability.cwe && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CWE:</span>
                  <span className="text-sm font-medium">{vulnerability.cwe || "Não informado"}</span>
                </div>
              )}
              {vulnerability.impact && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Impacto:</span>
                  <span className="text-sm font-medium">{vulnerability.impact || "Não informado"}</span>
                </div>
              )}
              {vulnerability.file_path && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Caminho do Arquivo:</span>
                  <span className="text-sm font-medium">{vulnerability.file_path || "Não informado"}</span>
                </div>
              )}
              {vulnerability.mitigation && (
                <div>
                  <span className="text-sm text-gray-600">Mitigação:</span>
                  <p className="text-sm font-medium mt-1">{vulnerability.mitigation || "Não informado"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Referências */}
          {vulnerability.references && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Referências</h3>
              <div className="text-sm text-gray-700 whitespace-pre-line">{vulnerability.references || "Não informado"}</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do Asset */}
          {assetInfo && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Informações do Asset</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="font-medium">{assetInfo.id || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{assetInfo.name || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Produto</p>
                  <p className="font-medium">{assetInfo.product || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Versão</p>
                  <p className="font-medium">{assetInfo.version || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vulnerabilidades no Asset</p>
                  <p className="font-medium">{assetInfo.vulnerabilities_count || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Score de Prioridade</p>
                  <p className="font-medium">{assetInfo.priority_score?.toFixed(2) || "Não informado"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informações de Gestão */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Gestão</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Responsável</label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{vulnerability.assignee || 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Histórico</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Detectada em</p>
                  <p className="text-sm">{vulnerability.createdAt ? new Date(vulnerability.createdAt).toLocaleString() : "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Última atualização</p>
                  <p className="text-sm">{vulnerability.updatedAt ? new Date(vulnerability.updatedAt).toLocaleString() : "Não informado"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Externos */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Links Externos</h3>
            <div className="space-y-3">
              <a
                href={`https://nvd.nist.gov/vuln/detail/${vulnerability.cve_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">NVD Database</span>
              </a>

              <a
                href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.cve_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">MITRE CVE</span>
              </a>

              {vulnerability.kev_status && (
                <a
                  href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-sm">CISA KEV Catalog</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VulnerabilityDetail;
