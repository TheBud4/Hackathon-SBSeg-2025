# Hackathon SBSeg 2025 

Estrutura mínima:

- `backend/` - FastAPI app
- `frontend/` - Vite + React app

Rápido para rodar localmente (Linux Mint):

1) Backend

```bash
python3 -m venv .venv; source .venv/bin/activate; pip install -r backend/requirements.txt; python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

2) Frontend

```bash
cd frontend; npm install; npm run dev
```

Abra http://localhost:5173 e você verá o valor vindo do backend na tela.

Deploy rápido no servidor (Linux Mint) - resumo:

- Crie virtualenv, instale requirements, configure systemd para rodar uvicorn (exemplo em `backend/backend.md`).
- Construa frontend com `npm run build` e sirva `frontend/dist` com Nginx. Configure Nginx para encaminhar `/api/` para o uvicorn (127.0.0.1:8000).
