from app import app, db
from models import Asset
from sqlalchemy import func

with app.app_context():
    # Encontra duplicatas por nome
    duplicates = db.session.query(
        Asset.name, func.count(Asset.id).label('count')
    ).group_by(Asset.name).having(func.count(Asset.id) > 1).all()
    
    if duplicates:
        print("Encontrados assets duplicados:")
        for name, count in duplicates:
            print(f"Name: {name}, Count: {count}")
    else:
        print("Nenhum asset duplicado encontrado.")
    
    total = Asset.query.count()
    print(f"Total de assets: {total}")