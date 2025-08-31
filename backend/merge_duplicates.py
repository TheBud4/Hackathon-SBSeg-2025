from app import app, db
from models import Asset, Vulnerability
from sqlalchemy import func

with app.app_context():
    # Find duplicates by name and version
    duplicates = db.session.query(
        Asset.name, Asset.version, func.count(Asset.id).label('count')
    ).group_by(Asset.name, Asset.version).having(func.count(Asset.id) > 1).all()
    
    print(f"Found {len(duplicates)} duplicate groups.")
    
    for name, version, count in duplicates:
        # Get all assets with this name and version
        assets = Asset.query.filter_by(name=name, version=version).all()
        if not assets:
            continue
        
        # Keep the one with the smallest id
        keep_asset = min(assets, key=lambda a: a.id)
        print(f"Keeping asset id {keep_asset.id} for {name}, {version}")
        
        # Update vulnerabilities to point to the kept asset
        for asset in assets:
            if asset.id != keep_asset.id:
                # Update vulnerabilities
                vuln_count = Vulnerability.query.filter_by(asset_id=asset.id).update({'asset_id': keep_asset.id})
                print(f"Updated {vuln_count} vulnerabilities from asset {asset.id} to {keep_asset.id}")
                # Delete the duplicate asset
                db.session.delete(asset)
        
        db.session.commit()
    
    print("Duplicate assets merged.")
    
    # Recalculate priority scores after merging
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
    print("Priority scores recalculated.")
