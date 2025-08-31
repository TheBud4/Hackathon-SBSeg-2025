import os
import ijson
from app import app, db
from models import Vulnerability, Asset

def load_data():
    data_dir = 'data_JSON'
    
    # Cache de assets para evitar múltiplas queries ao banco
    asset_cache = {asset.name: asset for asset in Asset.query.all()}

    for file in os.listdir(data_dir):
        if file.endswith('.json'):
            print(f"Carregando {file}...")
            file_path = os.path.join(data_dir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                count = 0
                for item in ijson.items(f, 'item'):
                    if not item.get('cve'):
                        continue # Pula se não houver CVE

                    # --- Criação ou obtenção do Asset ---
                    kev_info = item.get('kev') or {}
                    product_name = kev_info.get('product')
                    asset = None

                    if product_name:
                        if product_name in asset_cache:
                            asset = asset_cache[product_name]
                        else:
                            # Se não estiver no cache, verifica no banco
                            asset = Asset.query.filter_by(name=product_name).first()
                            if not asset:
                                asset = Asset(name=product_name)
                                db.session.add(asset)
                                db.session.flush() # Para obter o ID do novo asset
                            asset_cache[product_name] = asset
                    
                    # --- Preparação dos dados da Vulnerabilidade ---
                    cvss_info = item.get('cvss', {})
                    flags_info = item.get('flags', {})
                    
                    try:
                        cvss_score = float(cvss_info.get('baseScore')) if cvss_info.get('baseScore') else None
                    except (ValueError, TypeError):
                        cvss_score = None
                        
                    try:
                        epss_score = float(item.get('epss')) if item.get('epss') else None
                    except (ValueError, TypeError):
                        epss_score = None

                    vuln_data = {
                        'cve': item.get('cve'),
                        'published': item.get('published'),
                        'last_modified': item.get('lastModified'),
                        'description': item.get('description'),
                        'cvss_base_score': cvss_score,
                        'cvss_attack_vector': cvss_info.get('attackVector'),
                        'cvss_attack_complexity': cvss_info.get('attackComplexity'),
                        'cvss_privileges_required': cvss_info.get('privilegesRequired'),
                        'epss': epss_score,
                        'kev_vulnerability_name': kev_info.get('vulnerabilityName'),
                        'kev_date_added': kev_info.get('dateAdded'),
                        'kev_short_description': kev_info.get('shortDescription'),
                        'kev_required_action': kev_info.get('requiredAction'),
                        'kev_known_ransomware_campaign_use': kev_info.get('knownRansomwareCampaignUse'),
                        'exposed': str(flags_info.get('exposed', 'false')).lower() == 'true',
                        'criticality': item.get('criticality'),
                        'active': str(item.get('ativo', 'false')).lower() == 'true',
                        'asset_id': asset.id if asset else None
                    }
                    
                    vuln = Vulnerability(**vuln_data)
                    db.session.merge(vuln)
                    
                    count += 1
                    if count % 200 == 0:
                        db.session.commit()
                        print(f"Commit de {count} registros do arquivo {file}")
                
                db.session.commit()
                print(f"Finalizado. Carregados {count} registros do arquivo {file}")

    print("Carga de dados concluída.")

    # --- Calcular priority scores para os assets ---
    # ESTE BLOCO FOI MOVIDO PARA DENTRO DA FUNÇÃO
    print("Calculando scores de prioridade...")

    # --- DEFINA OS PESOS (Var) DA FÓRMULA AQUI ---
    cvss_weight = 1.0
    epss_weight = 100.0
    ransomware_weight = 1.5
    kev_weight = 1.0

    assets = Asset.query.all()
    for asset in assets:
        vulns = asset.vulnerabilities
        if not vulns:
            asset.priority_score = 0
            continue
            
        total_raw_score = 0.0
        
        for v in vulns:
            cvss_basescore = v.cvss_base_score if v.cvss_base_score is not None else 0.0
            epss = v.epss if v.epss is not None else 0.0
            knownRansomwareCampaignUse = str(v.kev_known_ransomware_campaign_use).lower() == 'true'
            criticality = int(v.criticality) if v.criticality and v.criticality.isdigit() else 1
            is_kev = bool(v.kev_vulnerability_name)

            cvss_term = (cvss_basescore * cvss_weight)
            epss_term = (epss * epss_weight)
            core_score = (cvss_term * epss_term) * criticality
            
            ransomware_bonus = (10 if knownRansomwareCampaignUse else 0) * ransomware_weight
            kev_bonus = (5 if is_kev else 0) * kev_weight
            
            vulnerability_srb = core_score + ransomware_bonus + kev_bonus
            total_raw_score += vulnerability_srb

        final_score = total_raw_score
        asset.priority_score = min(100, max(0, round(final_score, 2)))

    db.session.commit()
    print("Scores de prioridade calculados.")


if __name__ == '__main__':
    with app.app_context():
        load_data()