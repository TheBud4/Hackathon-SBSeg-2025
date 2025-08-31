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

  console.log('ID da URL:', id);

  useEffect(() => {
    const fetchVulnerabilityDetail = async () => {
      try {
        setIsLoading(true);

        // Buscar vulnerabilidades para encontrar a específica
        const vulnResponse = await axios.get("http://127.0.0.1:5000/vulnerabilities");
        const vulnerabilities = vulnResponse.data.vulnerabilities || [];

        console.log('Vulnerabilidades retornadas da API:', vulnerabilities.map(v => ({ id: v.id, title: v.title })));
        console.log('Total de vulnerabilidades:', vulnerabilities.length);

        // DEBUG: Verificar tipos de dados
        console.log('=== DEBUG ID MATCHING ===');
        console.log('ID da URL (tipo):', id, '(', typeof id, ')');
        console.log('Primeiros 5 IDs das vulnerabilidades:', vulnerabilities.slice(0, 5).map(v => ({ id: v.id, tipo: typeof v.id })));
        console.log('IDs únicos das vulnerabilidades:', [...new Set(vulnerabilities.map(v => v.id))].slice(0, 10));

        // Tentar diferentes formas de matching
        let vuln = vulnerabilities.find(v => v.id === id);
        console.log('Tentativa 1 - v.id === id:', vuln ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

        if (!vuln) {
          vuln = vulnerabilities.find(v => String(v.id) === String(id));
          console.log('Tentativa 2 - String(v.id) === String(id):', vuln ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        }

        if (!vuln) {
          vuln = vulnerabilities.find(v => v._id === id);
          console.log('Tentativa 3 - v._id === id:', vuln ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        }

        if (!vuln) {
          vuln = vulnerabilities.find(v => String(v._id) === String(id));
          console.log('Tentativa 4 - String(v._id) === String(id):', vuln ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        }

        console.log('Resultado final da busca:', vuln ? { id: vuln.id, _id: vuln._id, title: vuln.title } : 'VULNERABILIDADE NÃO ENCONTRADA');

        // Encontrar a vulnerabilidade específica
        console.log('Vulnerabilidade que será processada:', vuln ? vuln.id : 'NENHUMA');
        if (!vuln) {
          throw new Error('Vulnerabilidade não encontrada');
        }

        // Buscar assets para obter informações adicionais
        const assetsResponse = await axios.get("http://127.0.0.1:5000/assets");
        const assets = assetsResponse.data.assets || [];

        console.log('Assets retornados da API:', assets.map(a => ({ name: a.name, version: a.version, priority_score: a.priority_score })));
        console.log('Total de assets:', assets.length);

        // Tentar encontrar asset relacionado
        let relatedAsset = null;
        if (vuln.component_name && vuln.component_version) {
          const assetKey = `${vuln.component_name}:${vuln.component_version}`;
          relatedAsset = assets.find(asset => `${asset.name}:${asset.version}` === assetKey);
        }

        // Mapear dados da vulnerabilidade
        const mappedVulnerability = {
          _id: vuln.id,
          cve_id: vuln.vulnerability_ids,
          title: vuln.title,
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
          attack_vector: vuln.attack_vector || "Não informado",
          exploitability: vuln.exploitability || "Não informado",
          business_impact: vuln.business_impact || "Não informado",
          remediation_effort: vuln.remediation_effort || "Não informado",
          epss_score: vuln.epss_score || 0,
          kev_status: vuln.kev_status || false,
          recommendations: vuln.recommendations || [],
          tags: vuln.tags || [],
          scanner_data: vuln.scanner_data || null,
          ml_features: vuln.ml_features || null,
          analyzedAt: vuln.analyzed_at,
          updatedAt: vuln.updated_at,
        };

        setVulnerability(mappedVulnerability);
        setAssetInfo(relatedAsset);

        console.log('Vulnerabilidade mapeada com sucesso:', {
          id: mappedVulnerability._id,
          cve_id: mappedVulnerability.cve_id,
          title: mappedVulnerability.title,
          severity: mappedVulnerability.severity,
          priority_score: mappedVulnerability.priority_score
        });
        console.log('Asset relacionado encontrado:', relatedAsset ? { name: relatedAsset.name, version: relatedAsset.version } : 'Nenhum asset relacionado');

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
            <h1 className="text-3xl font-bold text-gray-900">{vulnerability.cve_id}</h1>
            <p className="text-gray-600 mt-1">{vulnerability.title}</p>
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
                {vulnerability.severity}
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
                {vulnerability.status?.replace('_', ' ')}
              </span>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Score CVSS</p>
              <p className="text-2xl font-bold text-gray-900">{vulnerability.cvss_score}</p>
            </div>
            <Shield className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Prioridade ML</p>
              <p className={`text-2xl font-bold ${getPriorityColor(vulnerability.priority_score || 0)}`}>
                {vulnerability.priority_score?.toFixed(1)}
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
            <p className="text-gray-700 leading-relaxed">{vulnerability.description}</p>
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

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vetor de Ataque:</span>
                    <span className="text-sm font-medium">{vulnerability.attack_vector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Exploitabilidade:</span>
                    <span className="text-sm font-medium">{vulnerability.exploitability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Impacto no Negócio:</span>
                    <span className="text-sm font-medium">{vulnerability.business_impact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Esforço de Remediação:</span>
                    <span className="text-sm font-medium">{vulnerability.remediation_effort}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Métricas de Threat Intelligence</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Score EPSS:</span>
                    <span className="text-sm font-medium">
                      {((vulnerability.epss_score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">KEV Status:</span>
                    <span className={`text-sm font-medium ${vulnerability.kev_status ? 'text-red-600' : 'text-green-600'}`}>
                      {vulnerability.kev_status ? 'Listado' : 'Não Listado'}
                    </span>
                  </div>
                  {vulnerability.scanner_data?.cvss_v3?.vector && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CVSS Vector:</span>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {vulnerability.scanner_data.cvss_v3.vector}
                      </span>
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

          {/* Recomendações */}
          {vulnerability.recommendations && vulnerability.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recomendações de Remediação</h3>
              <div className="space-y-3">
                {vulnerability.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-900">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features ML */}
          {vulnerability.ml_features && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Características para Machine Learning</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Disponibilidade de Exploit:</span>
                    <span className="text-sm font-medium">{vulnerability.ml_features.exploit_availability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Idade do Patch (dias):</span>
                    <span className="text-sm font-medium">{vulnerability.ml_features.patch_age_days}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Criticidade do Ativo:</span>
                    <span className="text-sm font-medium">{vulnerability.ml_features.asset_criticality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Exposição de Rede:</span>
                    <span className="text-sm font-medium">{vulnerability.ml_features.network_exposure}</span>
                  </div>
                </div>
              </div>
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
                  <p className="text-sm text-gray-600">Produto</p>
                  <p className="font-medium">{assetInfo.product}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vulnerabilidades no Asset</p>
                  <p className="font-medium">{assetInfo.vulnerabilities_count}</p>
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
                  <span className="text-sm">{vulnerability.assignee || 'Não atribuído'}</span>
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
                  <p className="text-sm">{new Date(vulnerability.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {vulnerability.analyzedAt && (
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Analisada em</p>
                    <p className="text-sm">{new Date(vulnerability.analyzedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Última atualização</p>
                  <p className="text-sm">{new Date(vulnerability.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {vulnerability.tags && vulnerability.tags.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {vulnerability.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

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
