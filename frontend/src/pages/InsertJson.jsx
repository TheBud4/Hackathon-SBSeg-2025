import React, { useState } from 'react'
import axios from 'axios'
import {Upload, FileText, CheckCircle, AlertCircle, Loader2, Database, Filter, Zap, ExternalLink} from 'lucide-react'

const JsonProcessor = () => {
  const [jsonInput, setJsonInput] = useState('')
  const [processingSteps, setProcessingSteps] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState(null)

  const initialSteps = [
    { id: 'validation', name: 'Validação JSON', status: 'pending', description: 'Verificando estrutura e formato do JSON' },
    { id: 'extraction', name: 'Extração de CVEs', status: 'pending', description: 'Identificando vulnerabilidades e campos críticos' },
    { id: 'enrichment', name: 'Enriquecimento via APIs', status: 'pending', description: 'Coletando dados CVSS, EPSS e KEV' },
    { id: 'normalization', name: 'Normalização', status: 'pending', description: 'Padronizando estrutura de dados' },
    { id: 'ml_analysis', name: 'Análise ML', status: 'pending', description: 'Calculando score de priorização' },
    { id: 'storage', name: 'Armazenamento', status: 'pending', description: 'Salvando no banco de dados' }
  ]

  // Mock APIs simuladas
  const mockApiData = {
    'CVE-2024-21413': {
      cvss: { score: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
      epss: { score: 0.89, percentile: 0.99 },
      kev: { listed: true, date_added: '2024-02-13' }
    },
    'CVE-2024-0519': {
      cvss: { score: 8.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H' },
      epss: { score: 0.43, percentile: 0.85 },
      kev: { listed: false }
    }
  }

  const updateStepStatus = (stepId, status, details) => {
    setProcessingSteps(prev => 
      prev.map(step => step.id === stepId ? { ...step, status, details } : step)
    )
  }

  const handleProcess = async () => {
    if (!jsonInput.trim()) {
      toast.error('Por favor, insira dados JSON para processar')
      return
    }

    setIsProcessing(true)
    setProcessingSteps(initialSteps)

    try {
      // Passo 1: Validação
      updateStepStatus('validation', 'processing')
      await new Promise(r => setTimeout(r, 1000))
      let parsedData
      try {
        parsedData = JSON.parse(jsonInput)
        updateStepStatus('validation', 'completed', 'JSON válido encontrado')
      } catch (error) {
        updateStepStatus('validation', 'error', 'JSON inválido')
        throw new Error('JSON inválido')
      }

      // Passo 2: Extração
      updateStepStatus('extraction', 'processing')
      await new Promise(r => setTimeout(r, 1500))
      const vulnerabilities = Array.isArray(parsedData.vulnerabilities) ? parsedData.vulnerabilities : [parsedData]
      const extractedVulns = vulnerabilities.filter(item => item.cve_id)
      updateStepStatus('extraction', 'completed', `${extractedVulns.length} vulnerabilidades encontradas`)

      // Passo 3: Enriquecimento (mock via axios)
      updateStepStatus('enrichment', 'processing')
      await new Promise(r => setTimeout(r, 2000))
      const enrichedVulns = await Promise.all(
        extractedVulns.map(async vuln => {
          const cveId = vuln.cve_id
          // Simulação de chamada API com axios (mock local)
          const apiData = mockApiData[cveId] || {
            cvss: { score: Math.random() * 10, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H' },
            epss: { score: Math.random(), percentile: Math.random() },
            kev: { listed: Math.random() > 0.7 }
          }
          // Simula request
          await axios.get('/mock-api') 
          return { ...vuln, enriched_data: apiData }
        })
      )
      updateStepStatus('enrichment', 'completed', 'Dados coletados via APIs')

      // Passo 4: Normalização
      updateStepStatus('normalization', 'processing')
      await new Promise(r => setTimeout(r, 1000))
      const normalizedVulns = enrichedVulns.map(vuln => ({
        cve_id: vuln.cve_id,
        title: vuln.title || `Vulnerability ${vuln.cve_id}`,
        description: vuln.description || 'Descrição não disponível',
        severity: vuln.enriched_data.cvss.score >= 9 ? 'CRITICAL' : 
                  vuln.enriched_data.cvss.score >= 7 ? 'HIGH' : 
                  vuln.enriched_data.cvss.score >= 4 ? 'MEDIUM' : 'LOW',
        cvss_score: vuln.enriched_data.cvss.score,
        epss_score: vuln.enriched_data.epss.score,
        kev_status: vuln.enriched_data.kev.listed,
        status: 'NEW',
        createdAt: new Date().toISOString()
      }))
      updateStepStatus('normalization', 'completed', 'Dados normalizados')

      // Passo 5: Análise ML
      updateStepStatus('ml_analysis', 'processing')
      await new Promise(r => setTimeout(r, 1500))
      const mlEnhancedVulns = normalizedVulns.map(vuln => {
        const features = {
          cvss_score: vuln.cvss_score / 10,
          epss_score: vuln.epss_score,
          kev_status: vuln.kev_status ? 1 : 0
        }
        const priority_score = (
          features.cvss_score * 0.4 +
          features.epss_score * 0.3 +
          features.kev_status * 0.3
        ) * 100
        return { ...vuln, priority_score }
      })
      updateStepStatus('ml_analysis', 'completed', 'Scores calculados')

      // Passo 6: "Storage" mock
      updateStepStatus('storage', 'processing')
      await new Promise(r => setTimeout(r, 1000))
      // Simula salvar com axios
      await axios.post('/mock-save', mlEnhancedVulns)
      updateStepStatus('storage', 'completed', `${mlEnhancedVulns.length} vulnerabilidades salvas`)

      setProcessedData({
        processed: mlEnhancedVulns.length,
        vulnerabilities: mlEnhancedVulns
      })
      toast.success(`${mlEnhancedVulns.length} vulnerabilidades processadas com sucesso!`)
    } catch (error) {
      toast.error(`Erro no processamento: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const sampleJson = `{
  "vulnerabilities": [
    {
      "cve_id": "CVE-2024-21413",
      "title": "Microsoft Outlook Remote Code Execution Vulnerability",
      "description": "A remote code execution vulnerability exists in Microsoft Outlook",
      "severity": "CRITICAL",
      "affected_systems": ["Exchange Server 2019", "Outlook 365"]
    },
    {
      "cve_id": "CVE-2024-0519", 
      "title": "Google Chrome Out of bounds memory access in V8",
      "description": "Out of bounds memory access in V8 in Google Chrome",
      "severity": "HIGH",
      "affected_systems": ["Chrome Browser Fleet"]
    }
  ]
}`

  const loadSample = () => {
    setJsonInput(sampleJson)
    toast.success('Dados de exemplo carregados')
  }

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Processador de Logs JSON</h1>
        <p className="text-gray-600 mt-2">
          Processe logs de vulnerabilidades com extração automática de CVEs e enriquecimento via APIs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Dados JSON de Entrada</span>
              </h3>
              <button onClick={loadSample} className="text-sm text-blue-600 hover:text-blue-800">
                Carregar Exemplo
              </button>
            </div>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Cole seus dados JSON aqui..."
            />
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">{jsonInput.length} caracteres</p>
              <button
                onClick={handleProcess}
                disabled={isProcessing || !jsonInput.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{isProcessing ? 'Processando...' : 'Processar JSON'}</span>
              </button>
            </div>
          </div>

          {/* Pipeline info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Pipeline de Processamento</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">1. Extração e Filtros</p>
                  <p className="text-sm text-blue-700">Identifica CVEs e campos críticos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <ExternalLink className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">2. APIs de Threat Intelligence</p>
                  <p className="text-sm text-purple-700">CVSS, EPSS, KEV via APIs</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">3. Machine Learning</p>
                  <p className="text-sm text-green-700">Algoritmo de priorização inteligente</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <Database className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">4. Normalização e Storage</p>
                  <p className="text-sm text-orange-700">Estrutura padronizada (mock)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-6">
          {processingSteps.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Status do Processamento</h3>
              <div className="space-y-4">
                {processingSteps.map((step, i) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-gray-900">{step.name}</p>
                        <span className="text-sm text-gray-500">{i+1}/{processingSteps.length}</span>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {step.details && <p className="text-xs text-blue-600 mt-1">{step.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processedData && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Resultados do Processamento</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-900">Processamento Concluído com Sucesso!</p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {processedData.processed} vulnerabilidades processadas.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Vulnerabilidades:</h4>
                {processedData.vulnerabilities.slice(0,3).map((vuln, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{vuln.cve_id}</p>
                        <p className="text-sm text-gray-600 truncate">{vuln.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">Score: {vuln.priority_score?.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">CVSS: {vuln.cvss_score?.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {processedData.vulnerabilities.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{processedData.vulnerabilities.length - 3} vulnerabilidades adicionais
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JsonProcessor
