# QS-AI Admin Web

Vue 3 + TypeScript + Element Plus frontend for the QS-AI Spring Boot 3.2.5 backend.

## Related Repositories

- Backend: https://github.com/senshiqin/QS-AI-ADMIAN
- Default backend URL: `http://localhost:8080`

## Run

```powershell
cd qs-ai-admin-web
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:8080`.

## Engineering Quality

- Frontend CI: `.github/workflows/ci.yml` runs `npm ci` and `npm run build`.
- API map: [docs/API_MAP.md](docs/API_MAP.md)
- Formatting baseline: `.editorconfig` and `.prettierrc.json`.

Useful local commands:

```bash
npm run build
```

## Pages

- Login
- Dashboard
- AI Chat
- RAG Retrieval / Streaming QA
- Knowledge Documents
- Model Config
