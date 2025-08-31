from app import app, db
from models import Vulnerability, Asset, CVEFactors

with app.app_context():
    # Verificar vulnerabilidades
    vuln_count = Vulnerability.query.count()
    print(f"Total de vulnerabilidades: {vuln_count}")

    # Verificar assets
    asset_count = Asset.query.count()
    print(f"Total de assets: {asset_count}")

    # Verificar CVE factors
    cve_count = CVEFactors.query.count()
    print(f"Total de CVE factors: {cve_count}")

    # Verificar algumas vulnerabilidades
    if vuln_count > 0:
        print("\nPrimeiras 3 vulnerabilidades:")
        vulns = Vulnerability.query.limit(3).all()
        for vuln in vulns:
            print(f"ID: {vuln.id}, CVE: {getattr(vuln, 'vulnerability_ids', 'N/A')}, Severity: {getattr(vuln, 'severity', 'N/A')}")

    # Verificar alguns assets
    if asset_count > 0:
        print("\nPrimeiros 3 assets:")
        assets = Asset.query.limit(3).all()
        for asset in assets:
            print(f"ID: {asset.id}, Name: {asset.name}, Product: {asset.product}")

    # Verificar alguns CVE factors
    if cve_count > 0:
        print("\nPrimeiros 3 CVE factors:")
        cve_factors = CVEFactors.query.limit(3).all()
        for cf in cve_factors:
            print(f"ID: {cf.id}, CVE: {cf.cve_id}, Base Score: {cf.base_score}")
