## Backend (FastAPI) - Setup and deploy notes

Development (Linux Mint):

1. Create and activate virtualenv:

   python3 -m venv .venv
   source .venv/bin/activate

2. Install dependencies:

   pip install -r requirements.txt

3. Run development server:

   python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000


Production (Linux Mint) - minimal guide:

- Create a system user (optional) and a virtualenv in the project folder.
- Install packages into the virtualenv.
- Use a systemd unit to run uvicorn (example below).
- Use Nginx as a reverse proxy and to serve the built frontend static files.

Example systemd unit (/etc/systemd/system/hackathon-backend.service):

[Unit]
Description=Hackathon FastAPI backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/hackathon
Environment="PATH=/var/www/hackathon/.venv/bin"
ExecStart=/var/www/hackathon/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000

[Install]
WantedBy=multi-user.target


Nginx (reverse proxy) snippet:

server {
    listen 80;
    server_name example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/hackathon/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
