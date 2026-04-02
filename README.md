<div align="center">

# Claude Code — Leaked Source

**The full source code of Anthropic's Claude Code CLI, leaked on March 31, 2026**

[![TypeScript](https://img.shields.io/badge/TypeScript-512K%2B_lines-3178C6?logo=typescript&logoColor=white)](#tech-stack)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f472b6?logo=bun&logoColor=white)](#tech-stack)
[![React + Ink](https://img.shields.io/badge/UI-React_%2B_Ink-61DAFB?logo=react&logoColor=black)](#tech-stack)
[![Files](https://img.shields.io/badge/~1,900_files-source_only-grey)](#directory-structure)
[![MCP Server](https://img.shields.io/badge/MCP-Explorer_Server-blueviolet)](#-explore-with-mcp-server)
[![npm](https://img.shields.io/npm/v/warrioraashuu-codemaster?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/warrioraashuu-codemaster)
[![Twitter Follow](https://img.shields.io/twitter/follow/warrioraashuu?style=social)](https://twitter.com/intent/follow?screen_name=warrioraashuu)

> The original unmodified leaked source is preserved in the [`backup` branch](https://github.com/codeaashu/claude-code/tree/backup).

</div>

---

## Table of Contents

- [How It Leaked](#how-it-leaked)
- [What Is Claude Code?](#what-is-claude-code)
- [Documentation](#-documentation)
- [Explore with MCP Server](#-explore-with-mcp-server)
- [Directory Structure](#directory-structure)
- [Architecture](#architecture)
  - [Tool System](#1-tool-system)
  - [Command System](#2-command-system)
  - [Service Layer](#3-service-layer)
  - [Bridge System](#4-bridge-system)
  - [Permission System](#5-permission-system)
  - [Feature Flags](#6-feature-flags)
- [Key Files](#key-files)
- [Tech Stack](#tech-stack)
- [Design Patterns](#design-patterns)
- [GitPretty Setup](#gitpretty-setup)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## How It Leaked

[Chaofan Shou (@Fried_rice)](https://x.com/Fried_rice) discovered that the published npm package for Claude Code included a `.map` file referencing the full, unobfuscated TypeScript source — downloadable as a zip from Anthropic's R2 storage bucket.

> **"Claude code source code has been leaked via a map file in their npm registry!"**
>
> — [@Fried_rice, March 31, 2026](https://x.com/Fried_rice/status/2038894956459290963)

---

## What Is Claude Code?

Claude Code is Anthropic's official CLI tool for interacting with Claude directly from the terminal — editing files, running commands, searching codebases, managing git workflows, and more. This repository contains the leaked `src/` directory.

| | |
|---|---|
| **Leaked** | 2026-03-31 |
| **Language** | TypeScript (strict) |
| **Runtime** | [Bun](https://bun.sh) |
| **Terminal UI** | [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) |
| **Scale** | ~1,900 files · 512,000+ lines of code |

---

## � Documentation

For in-depth guides, see the [`docs/`](docs/) directory:

| Guide | Description |
|-------|-------------|
| **[Architecture](docs/architecture.md)** | Core pipeline, startup sequence, state management, rendering, data flow |
| **[Tools Reference](docs/tools.md)** | Complete catalog of all ~40 agent tools with categories and permission model |
| **[Commands Reference](docs/commands.md)** | All ~85 slash commands organized by category |
| **[Subsystems Guide](docs/subsystems.md)** | Deep dives into Bridge, MCP, Permissions, Plugins, Skills, Tasks, Memory, Voice |
| **[Exploration Guide](docs/exploration-guide.md)** | How to navigate the codebase — study paths, grep patterns, key files |

Also see: [CONTRIBUTING.md](CONTRIBUTING.md) · [MCP Server README](mcp-server/README.md)

---

## �🔍 Explore with MCP Server

This repo ships an [MCP server](https://modelcontextprotocol.io/) that lets any MCP-compatible client (Claude Code, Claude Desktop, VS Code Copilot, Cursor) explore the full source interactively.

### Install from npm

The MCP server is published as [`warrioraashuu-codemaster`](https://www.npmjs.com/package/warrioraashuu-codemaster) on npm — no need to clone the repo:

```bash
# Claude Code
claude mcp add warrioraashuu-codemaster -- npx -y warrioraashuu-codemaster
```

### One-liner setup (from source)

```bash
git clone https://github.com/codeaashu/claude-code.git ~/claude-code \
  && cd ~/claude-code/mcp-server \
  && npm install && npm run build \
  && claude mcp add claude-code-explorer -- node ~/claude-code/mcp-server/dist/index.js
```

<details>
<summary><strong>Step-by-step setup</strong></summary>

```bash
# 1. Clone the repo
git clone https://github.com/codeaashu/claude-code.git
cd claude-code/mcp-server

# 2. Install & build
npm install && npm run build

# 3. Register with Claude Code
claude mcp add claude-code-explorer -- node /absolute/path/to/claude-code/mcp-server/dist/index.js
```

Replace `/absolute/path/to/claude-code` with your actual clone path.

</details>

<details>
<summary><strong>VS Code / Cursor / Claude Desktop config</strong></summary>

**VS Code** — add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "claude-code-explorer": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/dist/index.js"],
      "env": { "CLAUDE_CODE_SRC_ROOT": "${workspaceFolder}/src" }
    }
  }
}
```

**Claude Desktop** — add to your config file:
```json
{
  "mcpServers": {
    "claude-code-explorer": {
      "command": "node",
      "args": ["/absolute/path/to/claude-code/mcp-server/dist/index.js"],
      "env": { "CLAUDE_CODE_SRC_ROOT": "/absolute/path/to/claude-code/src" }
    }
  }
}
```

**Cursor** — add to `~/.cursor/mcp.json` (same format as Claude Desktop).

</details>

### Available tools & prompts

| Tool | Description |
|------|-------------|
| `list_tools` | List all ~40 agent tools with source files |
| `list_commands` | List all ~50 slash commands with source files |
| `get_tool_source` | Read full source of any tool (e.g. BashTool, FileEditTool) |
| `get_command_source` | Read source of any slash command (e.g. review, mcp) |
| `read_source_file` | Read any file from `src/` by path |
| `search_source` | Grep across the entire source tree |
| `list_directory` | Browse `src/` directories |
| `get_architecture` | High-level architecture overview |

| Prompt | Description |
|--------|-------------|
| `explain_tool` | Deep-dive into how a specific tool works |
| `explain_command` | Understand a slash command's implementation |
| `architecture_overview` | Guided tour of the full architecture |
| `how_does_it_work` | Explain any subsystem (permissions, MCP, bridge, etc.) |
| `compare_tools` | Side-by-side comparison of two tools |

**Try asking:** *"How does the BashTool work?"* · *"Search for where permissions are checked"* · *"Show me the /review command source"*

### Custom source path / Remove

```bash
# Custom source location
claude mcp add claude-code-explorer -e CLAUDE_CODE_SRC_ROOT=/path/to/src -- node /path/to/mcp-server/dist/index.js

# Remove
claude mcp remove claude-code-explorer
```

---

## Directory Structure

```
src/
├── main.tsx                 # Entrypoint — Commander.js CLI parser + React/Ink renderer
├── QueryEngine.ts           # Core LLM API caller (~46K lines)
├── Tool.ts                  # Tool type definitions (~29K lines)
├── commands.ts              # Command registry (~25K lines)
├── tools.ts                 # Tool registry
├── context.ts               # System/user context collection
├── cost-tracker.ts          # Token cost tracking
│
├── tools/                   # Agent tool implementations (~40)
├── commands/                # Slash command implementations (~50)
├── components/              # Ink UI components (~140)
├── services/                # External service integrations
├── hooks/                   # React hooks (incl. permission checks)
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── screens/                 # Full-screen UIs (Doctor, REPL, Resume)
│
├── bridge/                  # IDE integration (VS Code, JetBrains)
├── coordinator/             # Multi-agent orchestration
├── plugins/                 # Plugin system
├── skills/                  # Skill system
├── server/                  # Server mode
├── remote/                  # Remote sessions
├── memdir/                  # Persistent memory directory
├── tasks/                   # Task management
├── state/                   # State management
│
├── voice/                   # Voice input
├── vim/                     # Vim mode
├── keybindings/             # Keybinding configuration
├── schemas/                 # Config schemas (Zod)
├── migrations/              # Config migrations
├── entrypoints/             # Initialization logic
├── query/                   # Query pipeline
├── ink/                     # Ink renderer wrapper
├── buddy/                   # Companion sprite (Easter egg 🐣)
├── native-ts/               # Native TypeScript utils
├── outputStyles/            # Output styling
└── upstreamproxy/           # Proxy configuration
```

---

## Architecture

### 1. Tool System

> `src/tools/` — Every tool Claude can invoke is a self-contained module with its own input schema, permission model, and execution logic.

| Tool | Description |
|---|---|
| **File I/O** | |
| `FileReadTool` | Read files (images, PDFs, notebooks) |
| `FileWriteTool` | Create / overwrite files |
| `FileEditTool` | Partial modification (string replacement) |
| `NotebookEditTool` | Jupyter notebook editing |
| **Search** | |
| `GlobTool` | File pattern matching |
| `GrepTool` | ripgrep-based content search |
| `WebSearchTool` | Web search |
| `WebFetchTool` | Fetch URL content |
| **Execution** | |
| `BashTool` | Shell command execution |
| `SkillTool` | Skill execution |
| `MCPTool` | MCP server tool invocation |
| `LSPTool` | Language Server Protocol integration |
| **Agents & Teams** | |
| `AgentTool` | Sub-agent spawning |
| `SendMessageTool` | Inter-agent messaging |
| `TeamCreateTool` / `TeamDeleteTool` | Team management |
| `TaskCreateTool` / `TaskUpdateTool` | Task management |
| **Mode & State** | |
| `EnterPlanModeTool` / `ExitPlanModeTool` | Plan mode toggle |
| `EnterWorktreeTool` / `ExitWorktreeTool` | Git worktree isolation |
| `ToolSearchTool` | Deferred tool discovery |
| `SleepTool` | Proactive mode wait |
| `CronCreateTool` | Scheduled triggers |
| `RemoteTriggerTool` | Remote trigger |
| `SyntheticOutputTool` | Structured output generation |

### 2. Command System

> `src/commands/` — User-facing slash commands invoked with `/` in the REPL.

| Command | Description | | Command | Description |
|---|---|---|---|---|
| `/commit` | Git commit | | `/memory` | Persistent memory |
| `/review` | Code review | | `/skills` | Skill management |
| `/compact` | Context compression | | `/tasks` | Task management |
| `/mcp` | MCP server management | | `/vim` | Vim mode toggle |
| `/config` | Settings | | `/diff` | View changes |
| `/doctor` | Environment diagnostics | | `/cost` | Check usage cost |
| `/login` / `/logout` | Auth | | `/theme` | Change theme |
| `/context` | Context visualization | | `/share` | Share session |
| `/pr_comments` | PR comments | | `/resume` | Restore session |
| `/desktop` | Desktop handoff | | `/mobile` | Mobile handoff |

### 3. Service Layer

> `src/services/` — External integrations and core infrastructure.

| Service | Description |
|---|---|
| `api/` | Anthropic API client, file API, bootstrap |
| `mcp/` | Model Context Protocol connection & management |
| `oauth/` | OAuth 2.0 authentication |
| `lsp/` | Language Server Protocol manager |
| `analytics/` | GrowthBook feature flags & analytics |
| `plugins/` | Plugin loader |
| `compact/` | Conversation context compression |
| `extractMemories/` | Automatic memory extraction |
| `teamMemorySync/` | Team memory synchronization |
| `tokenEstimation.ts` | Token count estimation |
| `policyLimits/` | Organization policy limits |
| `remoteManagedSettings/` | Remote managed settings |

### 4. Bridge System

> `src/bridge/` — Bidirectional communication layer connecting IDE extensions (VS Code, JetBrains) with the CLI.

Key files: `bridgeMain.ts` (main loop) · `bridgeMessaging.ts` (protocol) · `bridgePermissionCallbacks.ts` (permission callbacks) · `replBridge.ts` (REPL session) · `jwtUtils.ts` (JWT auth) · `sessionRunner.ts` (session execution)

### 5. Permission System

> `src/hooks/toolPermission/` — Checks permissions on every tool invocation.

Prompts the user for approval/denial or auto-resolves based on the configured permission mode: `default`, `plan`, `bypassPermissions`, `auto`, etc.

### 6. Feature Flags

Dead code elimination at build time via Bun's `bun:bundle`:

```typescript
import { feature } from 'bun:bundle'

const voiceCommand = feature('VOICE_MODE')
  ? require('./commands/voice/index.js').default
  : null
```

Notable flags: `PROACTIVE` · `KAIROS` · `BRIDGE_MODE` · `DAEMON` · `VOICE_MODE` · `AGENT_TRIGGERS` · `MONITOR_TOOL`

---

## Key Files

| File | Lines | Purpose |
|------|------:|---------|
| `QueryEngine.ts` | ~46K | Core LLM API engine — streaming, tool loops, thinking mode, retries, token counting |
| `Tool.ts` | ~29K | Base types/interfaces for all tools — input schemas, permissions, progress state |
| `commands.ts` | ~25K | Command registration & execution with conditional per-environment imports |
| `main.tsx` | — | CLI parser + React/Ink renderer; parallelizes MDM, keychain, and GrowthBook on startup |

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Language | TypeScript (strict) |
| Terminal UI | [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) |
| CLI Parsing | [Commander.js](https://github.com/tj/commander.js) (extra-typings) |
| Schema Validation | [Zod v4](https://zod.dev) |
| Code Search | [ripgrep](https://github.com/BurntSushi/ripgrep) (via GrepTool) |
| Protocols | [MCP SDK](https://modelcontextprotocol.io) · LSP |
| API | [Anthropic SDK](https://docs.anthropic.com) |
| Telemetry | OpenTelemetry + gRPC |
| Feature Flags | GrowthBook |
| Auth | OAuth 2.0 · JWT · macOS Keychain |

---

## Design Patterns

<details>
<summary><strong>Parallel Prefetch</strong> — Startup optimization</summary>

MDM settings, keychain reads, and API preconnect fire in parallel as side-effects before heavy module evaluation:

```typescript
// main.tsx
startMdmRawRead()
startKeychainPrefetch()
```

</details>

<details>
<summary><strong>Lazy Loading</strong> — Deferred heavy modules</summary>

OpenTelemetry (~400KB) and gRPC (~700KB) are loaded via dynamic `import()` only when needed.

</details>

<details>
<summary><strong>Agent Swarms</strong> — Multi-agent orchestration</summary>

Sub-agents spawn via `AgentTool`, with `coordinator/` handling orchestration. `TeamCreateTool` enables team-level parallel work.

</details>

<details>
<summary><strong>Skill System</strong> — Reusable workflows</summary>

Defined in `skills/` and executed through `SkillTool`. Users can add custom skills.

</details>

<details>
<summary><strong>Plugin Architecture</strong> — Extensibility</summary>

Built-in and third-party plugins loaded through the `plugins/` subsystem.

</details>

---

## GitPretty Setup

<details>
<summary>Show per-file emoji commit messages in GitHub's file UI</summary>

```bash
# Apply emoji commits
bash ./gitpretty-apply.sh .

# Optional: install hooks for future commits
bash ./gitpretty-apply.sh . --hooks

# Push as usual
git push origin main
```

</details>

---

## Contributing

Contributions to documentation, the MCP server, and exploration tooling are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

> **Note:** The `src/` directory is the original leaked source and should not be modified.

---

## Disclaimer

This repository archives source code leaked from Anthropic's npm registry on **2026-03-31**. All original source code is the property of [Anthropic](https://www.anthropic.com). This is not an official release and is not licensed for redistribution. Contact [aashuu ✦](https://x.com/warrioraashuu) for any comments.

---

<a href="https://www.star-history.com/?repos=codeaashu%2Fclaude-code&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=codeaashu/claude-code&type=date&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=codeaashu/claude-code&type=date&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=codeaashu/claude-code&type=date&legend=bottom-right" />
 </picture>
</a>



