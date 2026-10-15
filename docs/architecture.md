# Architecture

> Deep-dive into how Claude Code is structured internally.

> 📐 **Looking for the full code-grounded deep dive with architecture diagrams?**
> See [`docs/internals/`](internals/README.md) — a 14-part guide (master Mermaid diagrams +
> per-subsystem walkthroughs of the query loop, tools, permissions, MCP, agents, bridge, and more).

---

## High-Level Overview

Claude Code is a terminal-native AI coding assistant built as a single-binary CLI. The architecture follows a pipeline model:

```
User Input → CLI Parser → Query Engine → LLM API → Tool Execution Loop → Terminal UI
```

The entire UI layer is built with **React + Ink** (React for the terminal), making it a fully reactive CLI application with components, hooks, state management, and all the patterns you'd expect in a React web app — just rendered to the terminal.

---

## Core Pipeline

### 1. Entrypoint (`src/main.tsx`)

The CLI parser is built with [Commander.js](https://github.com/tj/commander.js) (`@commander-js/extra-typings`). On startup, it:

- Fires parallel prefetch side-effects (MDM settings, Keychain, API preconnect) before heavy module imports
- Parses CLI arguments and flags
- Initializes the React/Ink renderer
- Hands off to the REPL launcher (`src/replLauncher.tsx`)

### 2. Initialization (`src/entrypoints/`)

| File | Role |
|------|------|
| `cli.tsx` | CLI session orchestration — the main path from launch to REPL |
| `init.ts` | Config, telemetry, OAuth, MDM policy initialization |
| `mcp.ts` | MCP server mode entrypoint (Claude Code as an MCP server) |
| `sdk/` | Agent SDK — programmatic API for embedding Claude Code |

Startup performs parallel initialization: MDM policy reads, Keychain prefetch, feature flag checks, then core init.

### 3. Query Engine (`src/QueryEngine.ts`, ~46K lines)

The heart of Claude Code. Handles:

- **Streaming responses** from the Anthropic API
- **Tool-call loops** — when the LLM requests a tool, execute it and feed the result back
- **Thinking mode** — extended thinking with budget management
- **Retry logic** — automatic retries with backoff for transient failures
- **Token counting** — tracks input/output tokens and cost per turn
- **Context management** — manages conversation history and context windows

### 4. Tool System (`src/Tool.ts` + `src/tools/`)

Every capability Claude can invoke is a **tool**. Each tool is self-contained with:

- **Input schema** (Zod validation)
- **Permission model** (what needs user approval)
- **Execution logic** (the actual implementation)
- **UI components** (how invocation/results render in the terminal)

Tools are registered in `src/tools.ts` and discovered by the Query Engine during tool-call loops.

See [Tools Reference](tools.md) for the complete catalog.

### 5. Command System (`src/commands.ts` + `src/commands/`)

User-facing slash commands (`/commit`, `/review`, `/mcp`, etc.) that can be typed in the REPL. Three types:

| Type | Description | Example |
|------|-------------|---------|
| **PromptCommand** | Sends a formatted prompt to the LLM with injected tools | `/review`, `/commit` |
| **LocalCommand** | Runs in-process, returns plain text | `/cost`, `/version` |
| **LocalJSXCommand** | Runs in-process, returns React JSX | `/doctor`, `/install` |

Commands are registered in `src/commands.ts` and invoked via `/command-name` in the REPL.

See [Commands Reference](commands.md) for the complete catalog.

---

## State Management

Claude Code uses a **React context + custom store** pattern:

| Component | Location | Purpose |
|-----------|----------|---------|
| `AppState` | `src/state/AppStateStore.ts` | Global mutable state object |
| Context Providers | `src/context/` | React context for notifications, stats, FPS |
| Selectors | `src/state/` | Derived state functions |
| Change Observers | `src/state/onChangeAppState.ts` | Side-effects on state changes |

The `AppState` object is passed into tool contexts, giving tools access to conversation history, settings, and runtime state.

---

## UI Layer

### Components (`src/components/`, ~140 components)

- Functional React components using Ink primitives (`Box`, `Text`, `useInput()`)
- Styled with [Chalk](https://github.com/chalk/chalk) for terminal colors
- React Compiler enabled for optimized re-renders
- Design system primitives in `src/components/design-system/`

### Screens (`src/screens/`)

Full-screen UI modes:

| Screen | Purpose |
|--------|---------|
| `REPL.tsx` | Main interactive REPL (the default screen) |
| `Doctor.tsx` | Environment diagnostics (`/doctor`) |
| `ResumeConversation.tsx` | Session restore (`/resume`) |

### Hooks (`src/hooks/`, ~80 hooks)

Standard React hooks pattern. Notable categories:

- **Permission hooks** — `useCanUseTool`, `src/hooks/toolPermission/`
- **IDE integration** — `useIDEIntegration`, `useIdeConnectionStatus`, `useDiffInIDE`
- **Input handling** — `useTextInput`, `useVimInput`, `usePasteHandler`, `useInputBuffer`
- **Session management** — `useSessionBackgrounding`, `useRemoteSession`, `useAssistantHistory`
- **Plugin/skill hooks** — `useManagePlugins`, `useSkillsChange`
- **Notification hooks** — `src/hooks/notifs/` (rate limits, deprecation warnings, etc.)

---

## Configuration & Schemas

### Config Schemas (`src/schemas/`)

Zod v4-based schemas for all configuration:

- User settings
- Project-level settings
- Organization/enterprise policies
- Permission rules

### Migrations (`src/migrations/`)

Handles config format changes between versions — reads old configs and transforms them to the current schema.

---

## Build System

### Bun Runtime

Claude Code runs on [Bun](https://bun.sh) (not Node.js). Key implications:

- Native JSX/TSX support without a transpilation step
- `bun:bundle` feature flags for dead-code elimination
- ES modules with `.js` extensions (Bun convention)

### Feature Flags (Dead Code Elimination)

```typescript
import { feature } from 'bun:bundle'

// Code inside inactive feature flags is completely stripped at build time
if (feature('VOICE_MODE')) {
  const voiceCommand = require('./commands/voice/index.js').default
}
```

Notable flags:

| Flag | Feature |
|------|---------|
| `PROACTIVE` | Proactive agent mode (autonomous actions) |
| `KAIROS` | Kairos subsystem |
| `BRIDGE_MODE` | IDE bridge integration |
| `DAEMON` | Background daemon mode |
| `VOICE_MODE` | Voice input/output |
| `AGENT_TRIGGERS` | Triggered agent actions |
| `MONITOR_TOOL` | Monitoring tool |
| `COORDINATOR_MODE` | Multi-agent coordinator |
| `WORKFLOW_SCRIPTS` | Workflow automation scripts |

### Lazy Loading

Heavy modules are deferred via dynamic `import()` until first use:

- OpenTelemetry (~400KB)
- gRPC (~700KB)
- Other optional dependencies

---

## Error Handling & Telemetry

### Telemetry (`src/services/analytics/`)

- [GrowthBook](https://www.growthbook.io/) for feature flags and A/B testing
- [OpenTelemetry](https://opentelemetry.io/) for distributed tracing and metrics
- Custom event tracking for usage analytics

### Cost Tracking (`src/cost-tracker.ts`)

Tracks token usage and estimated cost per conversation turn. Accessible via the `/cost` command.

### Diagnostics (`/doctor` command)

The `Doctor.tsx` screen runs environment checks: API connectivity, authentication, tool availability, MCP server status, and more.

---

## Concurrency Model

Claude Code uses a **single-threaded event loop** (Bun/Node.js model) with:

- Async/await for I/O operations
- React's concurrent rendering for UI updates
- Web Workers or child processes for CPU-intensive tasks (gRPC, etc.)
- Tool concurrency safety — each tool declares `isConcurrencySafe()` to indicate if it can run in parallel with other tools

---

## See Also

- [Tools Reference](tools.md) — Complete catalog of all 40 agent tools
- [Commands Reference](commands.md) — Complete catalog of all slash commands
- [Subsystems Guide](subsystems.md) — Bridge, MCP, permissions, skills, plugins, and more
- [Exploration Guide](exploration-guide.md) — How to navigate this codebase
