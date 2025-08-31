from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # O nome do produto, extraído de kev.product
    name = db.Column(db.String, unique=True, nullable=False)
    # Score de priorização calculado
    priority_score = db.Column(db.Float, default=0.0)

    vulnerabilities = db.relationship('Vulnerability', backref='asset', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'priority_score': self.priority_score,
            'vulnerabilities_count': len(self.vulnerabilities)
        }

class Vulnerability(db.Model):
    __tablename__ = 'vulnerabilities'

    # Usando CVE como chave primária, pois é um identificador único
    cve = db.Column(db.String, primary_key=True)
    published = db.Column(db.String)
    last_modified = db.Column(db.String)
    description = db.Column(db.Text)
    
    # Campos do objeto CVSS
    cvss_base_score = db.Column(db.Float)
    cvss_attack_vector = db.Column(db.String)
    cvss_attack_complexity = db.Column(db.String)
    cvss_privileges_required = db.Column(db.String)
    
    # EPSS Score
    epss = db.Column(db.Float)
    
    # Campos do objeto KEV (Known Exploited Vulnerabilities)
    kev_vulnerability_name = db.Column(db.String)
    kev_date_added = db.Column(db.String)
    kev_short_description = db.Column(db.Text)
    kev_required_action = db.Column(db.Text)
    kev_known_ransomware_campaign_use = db.Column(db.String)
    
    # Flag
    exposed = db.Column(db.Boolean)
    
    # Outros campos
    criticality = db.Column(db.String)
    active = db.Column(db.Boolean) # Mapeado do campo "ativo"

    # Chave estrangeira para o Asset
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}