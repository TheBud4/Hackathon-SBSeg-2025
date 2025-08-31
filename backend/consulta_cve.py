import requests
import time
import json
import os
import math

# --- Configuração ---
# 1. COLE SUA CHAVE DE API DO NVD DIRETAMENTE AQUI. É OBRIGATÓRIO PARA ESTE SCRIPT.
NVD_API_KEY = "a4cffb87-5183-44f0-be96-a03c23ac0cb0"

# 2. Nomes dos arquivos de entrada, saída e KEV.
INPUT_FILENAME = "data_JSON/saida1.json"
OUTPUT_FILENAME = "data_JSON/resultado.json"
KEV_FILENAME = "data_JSON/known_exploited_vulnerabilities.json"

# ======================================================================================
# FUNÇÕES DE CARREGAMENTO E SALVAMENTO (sem alterações)
# ======================================================================================
def carregar_json(filename: str) -> list | dict:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[FATAL] Arquivo essencial não encontrado: '{filename}'")
        exit()
    except json.JSONDecodeError:
        print(f"[FATAL] Arquivo '{filename}' não contém um JSON válido.")
        exit()

def carregar_dados_kev(filename: str) -> dict:
    print(f"[INFO] Carregando dados do KEV de '{filename}'...")
    data = carregar_json(filename)
    vulnerabilities = data.get('vulnerabilities', [])
    kev_map = {vuln['cveID']: vuln for vuln in vulnerabilities}
    print(f"[SUCCESS] {len(kev_map)} registros do KEV carregados.")
    return kev_map

def carregar_cves_ja_processados(filename: str) -> set:
    if not os.path.exists(filename):
        return set()
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content: return set()
            data = json.loads(content)
            return {item.get('cve') for item in data}
    except (json.JSONDecodeError, IOError):
        print(f"[WARNING] Arquivo de saída '{filename}' corrompido. Começando do zero.")
        return set()

def salvar_resultados(filename: str, data: list):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# ======================================================================================
# FUNÇÃO DE CONSULTA EPSS APRIMORADA COM FEEDBACK DETALHADO
# ======================================================================================
def consultar_epss_em_lotes(cves: list) -> dict:
    """Consulta a API do EPSS em lotes, agora com feedback de progresso detalhado."""
    total_cves = len(cves)
    print(f"\n[INFO] Consultando EPSS para {total_cves} CVEs (em lotes)...")
    print("[HINT] Esta etapa pode levar vários minutos. O progresso será exibido abaixo.")
    
    epss_scores = {}
    lote_size = 100
    total_lotes = math.ceil(total_cves / lote_size)
    start_time = time.time()

    for i in range(total_lotes):
        lote_inicio = i * lote_size
        lote_fim = lote_inicio + lote_size
        lote_cves = cves[lote_inicio:lote_fim]
        
        # Feedback antes de fazer a chamada de rede
        print(f"  -> Consultando lote EPSS {i + 1}/{total_lotes}...", end="", flush=True)

        cves_str = ",".join(lote_cves)
        url = "https://api.first.org/data/v1/epss"
        params = {"cve": cves_str}
        
        try:
            response = requests.get(url, params=params, timeout=45)
            if response.status_code == 200:
                data = response.json().get('data', [])
                for item in data:
                    epss_scores[item['cve']] = item.get('epss')
                print(f" OK ({len(data)} recebidos)")
            else:
                print(f" FALHA (Status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f" FALHA (Erro de rede: {e})")

        # Calcula e exibe tempo estimado
        if i > 0:
            elapsed_time = time.time() - start_time
            avg_time_per_lote = elapsed_time / (i + 1)
            remaining_lotes = total_lotes - (i + 1)
            estimated_remaining_time = remaining_lotes * avg_time_per_lote
            if estimated_remaining_time > 60:
                print(f"     (Estimativa: {estimated_remaining_time / 60:.1f} minutos restantes)")
            else:
                print(f"     (Estimativa: {estimated_remaining_time:.0f} segundos restantes)")

    print(f"\n[SUCCESS] {len(epss_scores)} pontuações EPSS obtidas.")
    return epss_scores

def consultar_nvd(cve_id: str) -> dict:
    # (Esta função permanece a mesma da versão anterior)
    headers = {'apiKey': NVD_API_KEY}
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve_id}"
    time.sleep(0.6)
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json().get('vulnerabilities', [])
        if not data: return {"error": "Não encontrado"}
        cve_data = data[0]['cve']
        description = next((desc['value'] for desc in cve_data.get('descriptions', []) if desc['lang'] == 'en'), "N/A")
        metrics = cve_data.get('metrics', {}).get('cvssMetricV31') or cve_data.get('metrics', {}).get('cvssMetricV30')
        cvss_info = {}
        if metrics:
            cvss_data = metrics[0]['cvssData']
            cvss_info = {
                "baseScore": cvss_data.get('baseScore', 'N/A'),
                "attackVector": cvss_data.get('attackVector', 'N/A'),
                "attackComplexity": cvss_data.get('attackComplexity', 'N/A'),
                "privilegesRequired": cvss_data.get('privilegesRequired', 'N/A')
            }
        return {
            "published": cve_data.get('published', 'N/A'),
            "lastModified": cve_data.get('lastModified', 'N/A'),
            "description": description,
            "cvss": cvss_info
        }
    except requests.exceptions.RequestException:
        return {"error": "Falha na requisição"}

def main():
    """Função principal para orquestrar o processo."""
    if not NVD_API_KEY or NVD_API_KEY == "SUA_CHAVE_API_AQUI":
        print("[FATAL] A variável NVD_API_KEY no topo do script não foi preenchida.")
        exit()

    dados_kev = carregar_dados_kev(KEV_FILENAME)
    registros_de_entrada = carregar_json(INPUT_FILENAME)
    cves_ja_processados_set = carregar_cves_ja_processados(OUTPUT_FILENAME)
    
    print(f"Encontrados {len(registros_de_entrada)} registros em '{INPUT_FILENAME}'.")
    print(f"Encontrados {len(cves_ja_processados_set)} registros já processados.")

    registros_a_processar = [reg for reg in registros_de_entrada if reg.get('cve') not in cves_ja_processados_set]
    
    if not registros_a_processar:
        print("Nenhum CVE novo para processar. O arquivo de saída já está atualizado.")
        return

    print(f"\n[INFO] Total de {len(registros_a_processar)} novos CVEs para processar.")
    cves_a_processar_lista = [reg.get('cve') for reg in registros_a_processar if reg.get('cve')]
    epss_data = consultar_epss_em_lotes(cves_a_processar_lista)

    resultados_finais = list(carregar_json(OUTPUT_FILENAME)) if os.path.exists(OUTPUT_FILENAME) and os.path.getsize(OUTPUT_FILENAME) > 0 else []

    print("\n[INFO] Iniciando consultas ao NVD (uma por uma, devido à limitação da API)...")
    for index, registro in enumerate(registros_a_processar):
        cve_id = registro.get('cve')
        if not cve_id: continue

        print(f"  -> Processando {index + 1}/{len(registros_a_processar)}: {cve_id}")

        nvd_info = consultar_nvd(cve_id)
        info_kev = dados_kev.get(cve_id)

        kev_output = None
        flags_output = {"exposed": "false"}
        if info_kev:
            print(f"     [!] Encontrado no catálogo KEV!")
            flags_output["exposed"] = "true"
            kev_output = {
                "product": info_kev.get("product", "N/A"),
                "vulnerabilityName": info_kev.get("vulnerabilityName", "N/A"),
                "dateAdded": info_kev.get("dateAdded", "N/A"),
                "shortDescription": info_kev.get("shortDescription", "N/A"),
                "requiredAction": info_kev.get("requiredAction", "N/A"),
                "knownRansomwareCampaignUse": info_kev.get("knownRansomwareCampaignUse", "N/A")
            }

        resultado_final = {
            "cve": cve_id,
            "published": nvd_info.get("published", "Erro"),
            "lastModified": nvd_info.get("lastModified", "Erro"),
            "description": nvd_info.get("description", "Erro"),
            "cvss": nvd_info.get("cvss", {}),
            "epss": epss_data.get(cve_id, "N/A"),
            "kev": kev_output,
            "flags": flags_output,
            "criticality": registro.get("criticality", "N/A"),
            "ativo": registro.get("ativo", "N/A")
        }
        
        resultados_finais.append(resultado_final)
        
        if (index + 1) % 25 == 0:
            print(f"\n--- Salvando progresso no arquivo ({index + 1} registros concluídos nesta sessão) ---")
            salvar_resultados(OUTPUT_FILENAME, resultados_finais)

    print("\n[SUCCESS] Processamento concluído. Salvando arquivo final...")
    salvar_resultados(OUTPUT_FILENAME, resultados_finais)
    print(f"Arquivo '{OUTPUT_FILENAME}' salvo com sucesso com {len(resultados_finais)} registros totais.")


if __name__ == "__main__":
    main()