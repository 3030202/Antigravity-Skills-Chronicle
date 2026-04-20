<div align="center">

# Antigravity: Skills Chronicle

**The visual management layer for AI Agent skills, workflows, and rules.**

[![VS Code](https://img.shields.io/badge/VS%20Code-Marketplace-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=ChronicleCore.antigravity-skills-chronicle)
[![Open VSX](https://img.shields.io/badge/Open%20VSX-Registry-A60EE5?style=for-the-badge&logo=eclipse-ide&logoColor=white)](https://open-vsx.org/extension/ChronicleCore/antigravity-skills-chronicle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Downloads](https://img.shields.io/badge/Downloads-4,300+-blue?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=ChronicleCore.antigravity-skills-chronicle)
[![Open Source](https://img.shields.io/badge/Open%20Source-Contributions%20Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<p align="center">
  <b>English</b> | <a href="README.zh-TW.md">繁體中文</a>
</p>

</div>

---

## The Story

Antigravity was born on **Christmas 2025** as a Python CLI tool for managing AI agent skills. Within four months, it evolved into a full VS Code extension with 4,300+ downloads, a force-directed topology graph, and a conversation archive system that could decrypt Gemini's binary `.pb` logs into searchable Markdown.

It was built by the **ChronicleCore A1 Expert System** — a structured team of 38 specialized AI agents, each with defined roles, permissions, and persistent memory, collaborating under a unified governance protocol. This extension was the first visual proof that such a system could produce real, shippable software.

The A1 system has since evolved beyond the Antigravity architecture. **This codebase is now fully open-sourced under MIT** — both as a working tool for the community and as a historical artifact of a new approach to AI-assisted software development.

> For the architectural framework behind this project, see [ChronicleCore-Architecture](https://github.com/Zaious/ChronicleCore-Architecture).

---

## Timeline

| Date | Version | Milestone |
|------|---------|-----------|
| 2025-12-25 | `v0.1.0` | Origin — Python CLI based on [skills-cli](https://github.com/kcchien/skills-cli) by KC Chien |
| 2026-01-21 | `v1.0.0` | Antigravity born — transformed into VS Code Extension |
| 2026-01-22 | `v1.0.3~1.0.7` | Five versions in a single day of explosive development |
| 2026-01-25 | **`v1.2.6`** | **First stable release** |
| 2026-02-25 | **`v2.0.0`** | Major rewrite — Star Map topology (d3-force), Activity Bar, conversation archive |
| 2026-03-05 | **`v2.1.0`** | Archive stabilizer + esbuild migration (VSIX 96MB → 2.3MB) |
| 2026-03-09 | — | Final update before architecture migration |
| 2026-04 | — | A1 Expert System migrates to next-gen architecture. Antigravity completes its mission |
| 2026-04-20 | — | **MIT open-sourced** — all users upgraded to Golden Supporter |

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Star Map Topology** | Dynamic force-directed graph showing relationships between agents, skills, and data (d3-force) |
| **Skills Dashboard** | View and manage all skills in `.agent/skills/` |
| **Workflow Manager** | Organize and execute workflows from `.agent/workflows/` |
| **Rules Inspector** | View and edit local (`.agent/rules/`) & global (`GEMINI.md`) rules |
| **Conversation Archive** | Decrypt `.pb` protobuf logs into searchable Markdown |
| **Dynamic Status Bar** | Real-time skill and workflow count in the IDE |

---

## Screenshots

### Intelligence Star Map

![Star Map](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-star-map.png)

Navigate knowledge, not folders. The Star Map visualizes complex connections between your agents, skills, and data.

### Conversation Archive & Deep Search

![History Archive](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-archive.png)

Decrypt and parse Gemini's `.pb` conversation files into human-readable, full-text searchable Markdown.

### System Dashboard

![Dashboard](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-dashboard.png)

High-level overview of skill, workflow, and rule counts — mission control for your AI agent environment.

### Deep Skill Inspection

![Skill Files](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-skill-files.png)

Inspect skill metadata, behavioral constraints, persona configurations, and synchronized memory.

### Workflow Orchestration

![Workflows](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-workflows.png)

Trigger complex multi-agent rituals with detailed SOP files and automation chains.

---

## Installation

### From VS Code Marketplace

Search **"Antigravity Skills Chronicle"** in VS Code Extensions, or:

```
ext install ChronicleCore.antigravity-skills-chronicle
```

### From Source

```bash
git clone https://github.com/Zaious/Antigravity-Skills-Chronicle.git
cd Antigravity-Skills-Chronicle
npm install
cd web && npm install && cd ..
npm run bundle
```

---

## Data Locations

**Local (per project)**
- Skills: `.agent/skills/`
- Workflows: `.agent/workflows/`
- Rules: `.agent/rules/`

**Global (user profile)**
- Global Rules: `~/.gemini/antigravity/GEMINI.md`
- Chronicle Exports: `~/.gemini/antigravity/.search_cache/`

---

## Architecture

```
.agent/                 # Example agent data (skills, workflows, rules)
│                       # Clone and open in VS Code to see the dashboard in action
│
src/                    # VS Code Extension backend (Node.js/TypeScript)
├── extension.ts        # Main entry point
├── core/               # History extraction, indexing
├── providers/          # VS Code TreeView providers
└── remote-bridge/      # Discord & Telegram bot integration

web/                    # Webview frontend (React + Vite + Tailwind)
└── src/
    ├── App.tsx         # Dashboard UI
    ├── components/     # Reusable components
    ├── hooks/          # React hooks
    └── types/          # TypeScript type definitions
```

---

## How This Was Built

This project was developed by a team of 5 AI agents (selected from a pool of 38) operating under a structured governance protocol. Each agent had defined roles, permission tiers, and accountability rules.

See **[AGENTS.md](AGENTS.md)** for the original team roster and collaboration protocols, or the **[English annotated version](AGENTS.en.md)** for a detailed explanation of how multi-agent software development works.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project is community-maintained. ChronicleCore reviews and publishes approved PRs to the VS Code Marketplace.

---

## Credits

- **Original CLI foundation**: [skills-cli](https://github.com/kcchien/skills-cli) by [KC Chien](https://github.com/kcchien) (MIT License)
- **Extension development**: [Zaious](https://github.com/Zaious) / ChronicleCore A1 Expert System

---

## License

[MIT](LICENSE) — see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for upstream attributions.

---

<div align="center">

**Built with the [ChronicleCore A1 Expert System](https://github.com/Zaious/ChronicleCore-Architecture) — 38 specialized AI agents, one unified architecture.**

**Made by [Zaious](https://github.com/Zaious) / ChronicleCore / 編年史記工作室**

</div>
