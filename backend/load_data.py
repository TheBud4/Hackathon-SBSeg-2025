import json
import os
from decimal import Decimal
import ijson
from app import app, db
from models import Vulnerability, Asset

def load_data():
    data_dir = 'data_JSON'
    valid_keys = set(Vulnerability.__table__.columns.keys())
    for file in os.listdir(data_dir):
        if file.endswith('.json'):
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
                    product = filtered_item.get('product')
                    file_path_val = filtered_item.get('file_path')
                    engagement = filtered_item.get('engagement')
                    
                    if component_name and product:
                        asset = Asset.query.filter_by(name=component_name, version=component_version, product=product).first()
                        if not asset:
                            asset = Asset(name=component_name, version=component_version, product=product, file_path=file_path_val, engagement=engagement)
                            db.session.add(asset)
                            db.session.flush()  # Get id
                        filtered_item['asset_id'] = asset.id
                    
                    vuln = Vulnerability(**filtered_item)
                    db.session.merge(vuln)  # Use merge to handle duplicates
                    count += 1
                    if count % 100 == 0:  # Commit every 100 to avoid large transactions
                        db.session.commit()
                        print(f"Committed {count} records from {file}")
                db.session.commit()
                print(f"Loaded {count} records from {file}")
    
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
