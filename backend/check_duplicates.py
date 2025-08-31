from app import app, db
from models import Asset
from sqlalchemy import func

with app.app_context():
    # Find duplicates by name and version
    duplicates = db.session.query(
        Asset.name, Asset.version, func.count(Asset.id).label('count')
    ).group_by(Asset.name, Asset.version).having(func.count(Asset.id) > 1).all()
    
    if duplicates:
        print("Found duplicate assets:")
        for name, version, count in duplicates:
            print(f"Name: {name}, Version: {version}, Count: {count}")
    else:
        print("No duplicate assets found.")
    
    # Also check total assets
    total = Asset.query.count()
    print(f"Total assets: {total}")
