# models.py
from sqlalchemy import Column, Integer, String, Float, Text
from .database import Base

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    # Chave primária
    cve = Column(String, primary_key=True, index=True)

    # Campos do nível principal
    published = Column(String)
    lastModified = Column(String)
    description = Column(Text) # Usamos Text para descrições longas
    epss = Column(Float)
    criticality = Column(String)
    ativo = Column(String)

    # Campos achatados do objeto 'cvss'
    cvss_base_score = Column(Float)
    cvss_attack_vector = Column(String)
    cvss_attack_complexity = Column(String)
    cvss_privileges_required = Column(String)

    # Campos achatados do objeto 'KEV'
    kev_product = Column(String)
    kev_vulnerability_name = Column(String)
    kev_date_added = Column(String)
    kev_short_description = Column(Text)
    kev_required_action = Column(Text)
    kev_known_ransomware_campaign_use = Column(String)