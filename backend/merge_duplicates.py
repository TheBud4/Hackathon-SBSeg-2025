from app import app, db
from models import Asset, Vulnerability
from sqlalchemy import func

with app.app_context():
    # Encontra duplicatas por nome
    duplicates = db.session.query(
        Asset.name, func.count(Asset.id).label('count')
    ).group_by(Asset.name).having(func.count(Asset.id) > 1).all()
    
    print(f"Encontrados {len(duplicates)} grupos de duplicatas.")
    
    for name, count in duplicates:
        assets = Asset.query.filter_by(name=name).order_by(Asset.id).all()
        if not assets:
            continue
        
        # Mantém o primeiro asset (com o menor ID)
        keep_asset = assets[0]
        print(f"Mantendo asset id {keep_asset.id} para o nome '{name}'")
        
        # Pega os IDs dos assets a serem removidos
        duplicate_ids = [a.id for a in assets[1:]]
        
        # Atualiza as vulnerabilidades para apontarem para o asset mantido
        if duplicate_ids:
            Vulnerability.query.filter(Vulnerability.asset_id.in_(duplicate_ids)).update({'asset_id': keep_asset.id})
            
            # Deleta os assets duplicados
            Asset.query.filter(Asset.id.in_(duplicate_ids)).delete(synchronize_session=False)

            print(f"Mesclados {len(duplicate_ids)} assets duplicados no asset {keep_asset.id}")

    db.session.commit()
    print("Mesclagem de assets duplicados concluída.")

    # O recálculo do score de prioridade já é feito no final do load_data.py
    # Se executar este script separadamente, pode ser útil recalcular aqui também.