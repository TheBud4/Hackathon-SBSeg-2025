from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String)  # component_name
    version = db.Column(db.String)  # component_version
    product = db.Column(db.String)
    file_path = db.Column(db.String)
    engagement = db.Column(db.String)
    priority_score = db.Column(db.Float)  # Calculated prioritization score 0-100

    vulnerabilities = db.relationship('Vulnerability', backref='asset')

class Vulnerability(db.Model):
    __tablename__ = 'vulnerabilities'

    id = db.Column(db.String, primary_key=True)
    criticality = db.Column(db.String)
    active = db.Column(db.String)
    component_name = db.Column(db.String)
    component_version = db.Column(db.String)
    created = db.Column(db.String)
    cvssv3 = db.Column(db.String)
    cvssv3_score = db.Column(db.String)
    cwe = db.Column(db.String)
    date = db.Column(db.String)
    description = db.Column(db.Text)
    duplicate = db.Column(db.String)
    dynamic_finding = db.Column(db.String)
    false_p = db.Column(db.String)
    file_path = db.Column(db.String)
    hash_code = db.Column(db.String)
    impact = db.Column(db.Text)
    is_mitigated = db.Column(db.String)
    last_reviewed = db.Column(db.String)
    last_reviewed_by = db.Column(db.String)
    last_status_update = db.Column(db.String)
    mitigation = db.Column(db.Text)
    numerical_severity = db.Column(db.String)
    out_of_scope = db.Column(db.String)
    references = db.Column(db.Text)
    reporter = db.Column(db.String)
    risk_accepted = db.Column(db.String)
    scanner_confidence = db.Column(db.String)
    service = db.Column(db.String)
    severity = db.Column(db.String)
    sla_age = db.Column(db.String)
    sla_days_remaining = db.Column(db.String)
    sla_deadline = db.Column(db.String)
    sla_expiration_date = db.Column(db.String)
    sla_start_date = db.Column(db.String)
    static_finding = db.Column(db.String)
    steps_to_reproduce = db.Column(db.Text)
    test = db.Column(db.String)
    test_id = db.Column(db.String)
    thread_id = db.Column(db.String)
    title = db.Column(db.String)
    under_defect_review = db.Column(db.String)
    under_review = db.Column(db.String)
    unique_id_from_tool = db.Column(db.String)
    url = db.Column(db.String)
    verified = db.Column(db.Boolean)
    violates_sla = db.Column(db.String)
    vuln_id_from_tool = db.Column(db.String)
    found_by = db.Column(db.String)
    engagement_id = db.Column(db.String)
    engagement = db.Column(db.String)
    product_id = db.Column(db.String)
    product = db.Column(db.String)
    endpoints = db.Column(db.String)
    vulnerability_ids = db.Column(db.String)
    tags = db.Column(db.String)

    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}