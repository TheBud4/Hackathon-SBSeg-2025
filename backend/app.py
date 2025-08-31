from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db, Vulnerability, Asset

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/vulnerabilities', methods=['GET'])
def get_vulnerabilities():
    vulns = Vulnerability.query.all()
    return jsonify({'vulnerabilities': [v.to_dict() for v in vulns]})

# Rota alterada para usar 'cve' que é um string
@app.route('/vulnerabilities/<string:cve>', methods=['GET'])
def get_vulnerability(cve):
    vuln = Vulnerability.query.get_or_404(cve)
    return jsonify(vuln.to_dict())

@app.route('/assets', methods=['GET'])
def get_assets():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Ordena por score de prioridade, do maior para o menor
    assets_query = Asset.query.order_by(Asset.priority_score.desc())
    assets_paginated = assets_query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'assets': [a.to_dict() for a in assets_paginated.items],
        'pagination': {
            'page': assets_paginated.page,
            'per_page': assets_paginated.per_page,
            'total': assets_paginated.total,
            'pages': assets_paginated.pages,
            'has_next': assets_paginated.has_next,
            'has_prev': assets_paginated.has_prev
        }
    })

@app.route('/assets/<int:id>', methods=['GET'])
def get_asset(id):
    asset = Asset.query.get_or_404(id)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Busca e pagina as vulnerabilidades associadas a este asset
    vulns_query = Vulnerability.query.filter_by(asset_id=asset.id).order_by(Vulnerability.cvss_base_score.desc())
    vulns_paginated = vulns_query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepara os dados das vulnerabilidades para o JSON de resposta
    vulns_data = []
    for v in vulns_paginated.items:
        vulns_data.append({
            'cve': v.cve,
            'title': v.kev_vulnerability_name,
            'cvss_base_score': v.cvss_base_score,
            'epss': v.epss,
            'criticality': v.criticality,
            'published': v.published
        })
    
    return jsonify({
        'asset': {
            'id': asset.id, 
            'name': asset.name,
            'priority_score': asset.priority_score
        }, 
        'vulnerabilities': vulns_data,
        'pagination': {
            'page': vulns_paginated.page,
            'per_page': vulns_paginated.per_page,
            'total': vulns_paginated.total,
            'pages': vulns_paginated.pages,
            'has_next': vulns_paginated.has_next,
            'has_prev': vulns_paginated.has_prev
        }
    })

if __name__ == '__main__':
    app.run(debug=True)