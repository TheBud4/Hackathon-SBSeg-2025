from app import app, db
from models import Asset

with app.app_context():
    assets = Asset.query.all()
    for asset in assets:
        if asset.name:
            # Extract the artifact name and capitalize the first letter
            parts = asset.name.split(':')
            if len(parts) > 1:
                artifact = parts[-1]
                formatted_product = artifact[0].upper() + artifact[1:] if artifact else asset.name
            else:
                formatted_product = asset.name
            asset.product = formatted_product
    db.session.commit()
    print("Updated product column for all assets.")
