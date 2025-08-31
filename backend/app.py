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

@app.route('/vulnerabilities/<id>', methods=['GET'])
def get_vulnerability(id):
    vuln = Vulnerability.query.get_or_404(id)
    return jsonify(vuln.to_dict())

@app.route('/assets', methods=['GET'])
def get_assets():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    assets_query = Asset.query.order_by(Asset.priority_score.desc())
    assets_paginated = assets_query.paginate(page=page, per_page=per_page, error_out=False)
    
    assets_data = []
    for a in assets_paginated.items:
        assets_data.append({
            'id': a.id, 
            'name': a.name, 
            'version': a.version, 
            'product': a.product, 
            'priority_score': a.priority_score, 
            'vulnerabilities_count': len(a.vulnerabilities)
        })
    
    return jsonify({
        'assets': assets_data,
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
    
    vulns_query = Vulnerability.query.filter_by(asset_id=asset.id)
    vulns_paginated = vulns_query.paginate(page=page, per_page=per_page, error_out=False)
    
    vulns_data = []
    for v in vulns_paginated.items:
        vulns_data.append({
            'id': v.id, 
            'title': v.title, 
            'severity': v.severity,
            'cvssv3_score': v.cvssv3_score,
            'description': v.description
        })
    
    return jsonify({
        'asset': {
            'id': asset.id, 
            'name': asset.name, 
            'version': asset.version, 
            'product': asset.product
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