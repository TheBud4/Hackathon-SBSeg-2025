import json
import os
from decimal import Decimal
import ijson
from app import app, db
from models import Vulnerability, Asset, CVEFactors

def load_data():
    data_dir = 'data_JSON'
    valid_keys = set(Vulnerability.__table__.columns.keys())
    for file in os.listdir(data_dir):
        if file.endswith('.json') and not file.startswith('fatoresCVE'):
            print(f"Loading {file}")
            file_path = os.path.join(data_dir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                count = 0
                for item in ijson.items(f, 'item'):
                    # Filter to valid columns and exclude Unnamed
                    filtered_item = {k: v for k, v in item.items() if k in valid_keys and not k.startswith('Unnamed')}
                    if not filtered_item.get('id'):
                        continue  # Skip items without id
                    # Convert Decimal to float
                    for k, v in filtered_item.items():
                        if isinstance(v, Decimal):
                            filtered_item[k] = float(v)
                    
                    # Create or get asset
                    component_name = filtered_item.get('component_name')
                    component_version = filtered_item.get('component_version')
                    file_path_val = filtered_item.get('file_path')
                    engagement = filtered_item.get('engagement')
                    
                    if component_name:
                        asset = Asset.query.filter_by(name=component_name, version=component_version).first()
                        if not asset:
                            # Format product
                            parts = component_name.split(':')
                            if len(parts) > 1:
                                artifact = parts[-1]
                                formatted_product = artifact[0].upper() + artifact[1:] if artifact else component_name
                            else:
                                formatted_product = component_name
                            asset = Asset(name=component_name, version=component_version, product=formatted_product, file_path=file_path_val, engagement=engagement)
                            db.session.add(asset)
                            db.session.flush()  # Get id
                        else:
                            # Ensure product is formatted
                            parts = component_name.split(':')
                            if len(parts) > 1:
                                artifact = parts[-1]
                                formatted_product = artifact[0].upper() + artifact[1:] if artifact else component_name
                            else:
                                formatted_product = component_name
                            if asset.product != formatted_product:
                                asset.product = formatted_product
                        filtered_item['asset_id'] = asset.id
                    
                    vuln = Vulnerability(**filtered_item)
                    db.session.merge(vuln)  # Use merge to handle duplicates
                    count += 1
                    if count % 100 == 0:  # Commit every 100 to avoid large transactions
                        db.session.commit()
                        print(f"Committed {count} records from {file}")
                db.session.commit()
                print(f"Loaded {count} records from {file}")
    
    # Load CVE factors
    fatores_file = os.path.join(data_dir, 'fatoresCVE_cleaned.json')
    if os.path.exists(fatores_file):
        print("Loading fatoresCVE_cleaned.json")
        with open(fatores_file, 'r', encoding='utf-8') as f:
            fatores_data = json.load(f)
            for item in fatores_data:
                cve_id = item.get('cve')
                if not cve_id:
                    continue
                # Check if vulnerability exists by vulnerability_ids field
                vuln = Vulnerability.query.filter_by(vulnerability_ids=cve_id).first()
                if not vuln:
                    continue  # Skip if no matching vulnerability
                # Flatten cvss
                cvss = item.get('cvss', {})
                if cvss is None:
                    cvss = {}
                base_score = cvss.get('baseScore')
                if base_score is not None:
                    try:
                        base_score = float(base_score)
                    except ValueError:
                        base_score = None
                attack_vector = cvss.get('attackVector')
                attack_complexity = cvss.get('attackComplexity')
                privileges_required = cvss.get('privilegesRequired')
                # Flags
                flags = item.get('flags', {})
                exposed = flags.get('exposed')
                # EPSS
                epss = item.get('epss')
                if epss is not None:
                    try:
                        epss = float(epss)
                    except ValueError:
                        epss = None
                # KEV - convert dict to JSON string if needed
                kev = item.get('kev')
                if kev is not None and isinstance(kev, dict):
                    kev = json.dumps(kev)
                # Create or update CVEFactors
                factors = CVEFactors.query.filter_by(cve_id=cve_id).first()
                if not factors:
                    factors = CVEFactors(
                        cve_id=cve_id,
                        published=item.get('published'),
                        last_modified=item.get('lastModified'),
                        description=item.get('description'),
                        base_score=base_score,
                        attack_vector=attack_vector,
                        attack_complexity=attack_complexity,
                        privileges_required=privileges_required,
                        epss=epss,
                        kev=kev,
                        exposed=exposed,
                        criticality=item.get('criticality'),
                        ativo=item.get('ativo')
                    )
                    db.session.add(factors)
                else:
                    # Update if needed
                    factors.published = item.get('published')
                    factors.last_modified = item.get('lastModified')
                    factors.description = item.get('description')
                    factors.base_score = base_score
                    factors.attack_vector = attack_vector
                    factors.attack_complexity = attack_complexity
                    factors.privileges_required = privileges_required
                    factors.epss = epss
                    factors.kev = kev
                    factors.exposed = exposed
                    factors.criticality = item.get('criticality')
                    factors.ativo = item.get('ativo')
            db.session.commit()
            print(f"Loaded {len(fatores_data)} CVE factors.")
    
    # Merge any potential duplicate assets
    print("Checking for duplicate assets...")
    from sqlalchemy import func
    duplicates = db.session.query(
        Asset.name, Asset.version, func.count(Asset.id).label('count')
    ).group_by(Asset.name, Asset.version).having(func.count(Asset.id) > 1).all()
    
    if duplicates:
        print(f"Found {len(duplicates)} duplicate groups. Merging...")
        for name, version, count in duplicates:
            assets = Asset.query.filter_by(name=name, version=version).all()
            if not assets:
                continue
            keep_asset = min(assets, key=lambda a: a.id)
            for asset in assets:
                if asset.id != keep_asset.id:
                    Vulnerability.query.filter_by(asset_id=asset.id).update({'asset_id': keep_asset.id})
                    db.session.delete(asset)
        db.session.commit()
        print("Duplicates merged.")
    else:
        print("No duplicates found.")
    
    # Calculate priority scores for assets
    print("Calculating priority scores...")
    assets = Asset.query.all()
    for asset in assets:
        vulns = asset.vulnerabilities
        if not vulns:
            asset.priority_score = 0
            continue
        vuln_count = len(vulns)
        criticality_sum = 0
        severity_sum = 0
        count_valid = 0
        severity_map = {'Critical': 10, 'High': 7, 'Medium': 5, 'Low': 3, 'Info': 1}
        for v in vulns:
            if v.criticality and v.criticality.isdigit():
                criticality_sum += int(v.criticality)
                count_valid += 1
            if v.severity in severity_map:
                severity_sum += severity_map[v.severity]
        avg_criticality = criticality_sum / count_valid if count_valid else 0
        avg_severity = severity_sum / vuln_count if vuln_count else 0
        # Formula: 40% criticality, 40% severity, 20% vuln_count (capped at 50)
        score = (avg_criticality / 10 * 40) + (avg_severity / 10 * 40) + (min(vuln_count, 50) / 50 * 20)
        asset.priority_score = min(100, max(0, score))
    db.session.commit()
    print("Priority scores calculated.")

if __name__ == '__main__':
    with app.app_context():
        load_data()
