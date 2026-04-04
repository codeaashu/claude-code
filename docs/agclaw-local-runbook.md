# AG-Claw Local Runbook

## Local Open-Weight Path

### Prerequisites

- Python on `PATH`
- Node.js and `npm` on `PATH`
- Ollama on `PATH`

### One-command startup

```powershell
cd "d:\OneDrive - AG SOLUTION\claude-code"
powershell -ExecutionPolicy Bypass -File .\scripts\start-agclaw-local.ps1 -PullModel
```

Default model:

- `qwen2.5-coder:7b`

This script will:

- verify Python, npm, and Ollama are available
- start `ollama serve` if needed
- optionally pull the default Ollama model
- start the backend in one PowerShell window
- start the web shell in a second PowerShell window

Then open:

- `http://localhost:3000`

### Manual startup

```powershell
ollama serve
ollama pull qwen2.5-coder:7b

cd "d:\OneDrive - AG SOLUTION\claude-code"
$env:PYTHONPATH="d:\OneDrive - AG SOLUTION\claude-code\backend"
python -m agclaw_backend.server --host 127.0.0.1 --port 8008

cd "d:\OneDrive - AG SOLUTION\claude-code\web"
$env:AGCLAW_BACKEND_URL="http://127.0.0.1:8008"
npm run dev
```

### UI path

- open `Settings`
- enable `Local mode`
- provider `ollama`
- model `qwen2.5-coder:7b`
- click `Check`
- chat

## Vision-capable local model

Example target:

- `Qwen/Qwen2.5-VL-7B-Instruct`

If your local endpoint exposes a compatible vision model, configure:

```powershell
$env:AGCLAW_SCREEN_VISION_PROVIDER="openai-compatible"
$env:AGCLAW_SCREEN_VISION_BASE_URL="http://127.0.0.1:8000"
$env:AGCLAW_SCREEN_VISION_MODEL="Qwen/Qwen2.5-VL-7B-Instruct"
```

## Hosted provider envs for current session only

```powershell
cd "d:\OneDrive - AG SOLUTION\claude-code"
. .\scripts\set-session-provider-env.ps1 -Provider both
```

This sets only:

- `OPENAI_API_KEY`
- `GITHUB_TOKEN`

for the current PowerShell session.
