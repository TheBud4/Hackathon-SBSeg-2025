# main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Importa tudo dos nossos outros arquivos
from . import models, schemas
from .database import SessionLocal, engine

# Cria a nova tabela no banco de dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Função para obter uma sessão do banco de dados (permanece a mesma)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTS ATUALIZADOS ---

@app.post("/vulnerabilities/", response_model=schemas.Vulnerability, status_code=201)
def create_vulnerability(vulnerability: schemas.VulnerabilityCreate, db: Session = Depends(get_db)):
    # Verifica se a CVE já existe
    db_vuln = db.query(models.Vulnerability).filter(models.Vulnerability.cve == vulnerability.cve).first()
    if db_vuln:
        raise HTTPException(status_code=400, detail="CVE já registrada")

    # Mapeia do schema aninhado para o modelo achatado
    db_vulnerability = models.Vulnerability(
        cve=vulnerability.cve,
        published=vulnerability.published,
        lastModified=vulnerability.lastModified,
        description=vulnerability.description,
        epss=vulnerability.epss,
        criticality=vulnerability.criticality,
        ativo=vulnerability.ativo,
        # Mapeando CVSS
        cvss_base_score=vulnerability.cvss.baseScore,
        cvss_attack_vector=vulnerability.cvss.attackVector,
        cvss_attack_complexity=vulnerability.cvss.attackComplexity,
        cvss_privileges_required=vulnerability.cvss.privilegesRequired,
        # Mapeando KEV
        kev_product=vulnerability.KEV.product,
        kev_vulnerability_name=vulnerability.KEV.vulnerabilityName,
        kev_date_added=vulnerability.KEV.dateAdded,
        kev_short_description=vulnerability.KEV.shortDescription,
        kev_required_action=vulnerability.KEV.requiredAction,
        kev_known_ransomware_campaign_use=vulnerability.KEV.knownRansomwareCampaignUse
    )
    
    db.add(db_vulnerability)
    db.commit()
    db.refresh(db_vulnerability)
    return db_vulnerability

@app.get("/vulnerabilities/", response_model=List[schemas.Vulnerability])
def read_vulnerabilities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vulnerabilities = db.query(models.Vulnerability).offset(skip).limit(limit).all()
    # Para retornar o formato aninhado, precisamos reconstruir os objetos
    results = []
    for vuln in vulnerabilities:
        results.append(schemas.Vulnerability(
            cve=vuln.cve,
            published=vuln.published,
            lastModified=vuln.lastModified,
            description=vuln.description,
            epss=vuln.epss,
            criticality=vuln.criticality,
            ativo=vuln.ativo,
            cvss=schemas.CvssBase(
                baseScore=vuln.cvss_base_score,
                attackVector=vuln.cvss_attack_vector,
                attackComplexity=vuln.cvss_attack_complexity,
                privilegesRequired=vuln.cvss_privileges_required
            ),
            KEV=schemas.KevBase(
                product=vuln.kev_product,
                vulnerabilityName=vuln.kev_vulnerability_name,
                dateAdded=vuln.kev_date_added,
                shortDescription=vuln.kev_short_description,
                requiredAction=vuln.kev_required_action,
                knownRansomwareCampaignUse=vuln.kev_known_ransomware_campaign_use
            )
        ))
    return results

@app.get("/vulnerabilities/{cve_id}", response_model=schemas.Vulnerability)
def read_vulnerability(cve_id: str, db: Session = Depends(get_db)):
    vuln = db.query(models.Vulnerability).filter(models.Vulnerability.cve == cve_id).first()
    if vuln is None:
        raise HTTPException(status_code=404, detail="Vulnerabilidade não encontrada")
    
    # Reconstrói o objeto para a resposta
    result = schemas.Vulnerability(
            cve=vuln.cve, published=vuln.published, lastModified=vuln.lastModified,
            description=vuln.description, epss=vuln.epss, criticality=vuln.criticality,
            ativo=vuln.ativo,
            cvss=schemas.CvssBase(
                baseScore=vuln.cvss_base_score, attackVector=vuln.cvss_attack_vector,
                attackComplexity=vuln.cvss_attack_complexity, privilegesRequired=vuln.cvss_privileges_required
            ),
            KEV=schemas.KevBase(
                product=vuln.kev_product, vulnerabilityName=vuln.kev_vulnerability_name,
                dateAdded=vuln.kev_date_added, shortDescription=vuln.kev_short_description,
                requiredAction=vuln.kev_required_action, knownRansomwareCampaignUse=vuln.kev_known_ransomware_campaign_use
            )
        )
    return result