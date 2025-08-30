import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {Search, Filter, SortDesc, Eye, AlertTriangle, Clock, Target, ExternalLink} from 'lucide-react'

const VulnerabilitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('priority_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data: vulnerabilities = [], isLoading, refetch } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const response = await lumi.entities.vulnerabilities.list({
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
        limit: 100
      })
      return response.list || []
    }
  })

  // Filtros aplicados
  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(vuln => {
      const matchesSearch = !searchTerm || 
        vuln.cve_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSeverity = severityFilter === 'ALL' || vuln.severity === severityFilter
      const matchesStatus = statusFilter === 'ALL' || vuln.status === statusFilter
      
      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [vulnerabilities, searchTerm, severityFilter, statusFilter])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'ANALYZING': return 'bg-purple-100 text-purple-800'
      case 'PRIORITIZED': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'DISMISSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (score: number) => {
    if (score >= 90) return 'text-red-600 font-bold'
    if (score >= 70) return 'text-orange-600 font-semibold'
    if (score >= 50) return 'text-yellow-600 font-medium'
    return 'text-green-600'
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
    )
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
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
                refetch()
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
        {filteredVulnerabilities.map((vuln) => (
          <div key={vuln._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{vuln.cve_id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(vuln.severity || '')}`}>
                    {vuln.severity}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vuln.status || '')}`}>
                    {vuln.status?.replace('_', ' ')}
                  </span>
                  {vuln.kev_status && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      KEV
                    </span>
                  )}
                </div>
                
                <h4 className="text-md font-medium text-gray-800 mb-2">{vuln.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{vuln.description}</p>
                
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>CVSS: {vuln.cvss_score}</span>
                  </div>
                  {vuln.epss_score && (
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>EPSS: {(vuln.epss_score * 100).toFixed(1)}%</span>
                    </div>
                  )}
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
                    <p className="text-xs text-gray-500 mb-1">Sistemas Afetados:</p>
                    <div className="flex flex-wrap gap-1">
                      {vuln.affected_systems.slice(0, 3).map((system: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
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
              </div>

              <div className="flex flex-col items-end space-y-3 ml-6">
                {/* Score de Prioridade */}
                {vuln.priority_score && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Score ML</p>
                    <p className={`text-2xl font-bold ${getPriorityColor(vuln.priority_score)}`}>
                      {vuln.priority_score.toFixed(1)}
                    </p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex space-x-2">
                  <Link
                    to={`/vulnerabilities/${vuln._id}`}
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

        {filteredVulnerabilities.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma vulnerabilidade encontrada</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou termos de busca.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VulnerabilitiesPage
