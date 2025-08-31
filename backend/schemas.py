# schemas.py
from pydantic import BaseModel
from typing import Optional

# Modelo para o objeto CVSS aninhado
class CvssBase(BaseModel):
    baseScore: Optional[float] = None
    attackVector: Optional[str] = None
    attackComplexity: Optional[str] = None
    privilegesRequired: Optional[str] = None

# Modelo para o objeto KEV aninhado
class KevBase(BaseModel):
    product: Optional[str] = None
    vulnerabilityName: Optional[str] = None
    dateAdded: Optional[str] = None
    shortDescription: Optional[str] = None
    requiredAction: Optional[str] = None
    knownRansomwareCampaignUse: Optional[str] = None

# Esquema base para a vulnerabilidade (usado para criação)
class VulnerabilityBase(BaseModel):
    cve: str
    published: Optional[str] = None
    lastModified: Optional[str] = None
    description: Optional[str] = None
    epss: Optional[float] = None
    criticality: Optional[str] = None
    ativo: Optional[str] = None
    cvss: CvssBase
    KEV: KevBase

# Esquema para criação
class VulnerabilityCreate(VulnerabilityBase):
    pass

# Esquema para leitura (o que a API retorna)
class Vulnerability(VulnerabilityBase):
    class Config:
        orm_mode = True