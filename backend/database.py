# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexão com o banco de dados SQLite
# MUDAMOS O NOME DO ARQUIVO PARA REFLETIR O CONTEÚDO
SQLALCHEMY_DATABASE_URL = "sqlite:///./vulnerabilities.db"

# O resto do arquivo permanece exatamente o mesmo
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()