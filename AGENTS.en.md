# Agent Roster

> **Type**: Agent Governance Document
> **Created**: 2026-02-21
> **Last Modified**: 2026-02-25
> **Archived**: 2026-03-09 (final commit before architecture migration)
> **System**: [ChronicleCore A1 Expert System](https://github.com/Zaious/ChronicleCore-Architecture)
>
> [繁體中文原始版](AGENTS.md)

---

## What is this?

This is the **original governance document** that defined which AI agents worked on this project, what permissions they held, and how they collaborated.

In the ChronicleCore A1 system, software is not built by a single AI — it is built by a **structured team of specialized agents**, each with defined roles, clearance levels, and accountability. This document is a preserved artifact of that process.

---

## Core Team

These agents held top-level operational clearance for Antigravity: Skills Chronicle.

| Agent | Role | Clearance | Primary Focus |
|-------|------|-----------|---------------|
| **Cardinal** (architect-system) | Expert System Architect | T0-T2 Strategic | System topology, cross-layer API design, structural integrity |
| **Archivist** (archivist-core) | Digital Asset Architect | T0-T3 Existential | Lossless migration, asset link validation, deprecation management |
| **Chief of Staff** (chief-of-staff) | Chief Strategy Officer | T0-T2 Strategic | Roadmap alignment, task atomization, marketing-development sync |
| **Weaver** (eng-react-ui) | Lead Frontend Architect | T0-T1 Executable | Pixel-perfect React/TypeScript WebView dashboard implementation |

### Support

| Agent | Role | Focus |
|-------|------|-------|
| **Mechanic** (eng-devops) | DevOps & Infrastructure | Extension backend (`extension.ts`) architecture and troubleshooting |

---

## Permission Tiers

The A1 system enforces a strict permission hierarchy to prevent unauthorized destructive actions:

| Tier | Definition | Example |
|------|-----------|---------|
| **T0** | Observable | Read files, search, analyze |
| **T1** | Executable | Write new files, modify code |
| **T2** | Strategic | Configuration changes, deployment, release |
| **T3** | Irreversible | Delete data, spend budget, migration |

---

## Collaboration Protocols

Two core directives governed this project:

1. **Mirror Rule** — Every agent must read `docs/project_brief.md` before contributing. No agent operates without understanding the full project scope.
2. **Verification Gate** — Any modified component must pass `npm run build` before being marked "complete." Verbal completion does not count as actual completion.

---

## About the A1 System

This project was built by **5 agents** selected from a pool of **38 specialized AI agents** in the ChronicleCore A1 Expert System. Each agent in the full system has:

- A unique **persona** with defined personality, speaking style, and values
- A **permission tier** controlling what actions they can take
- **Persistent memory** through soul files (diary, preferences, directives)
- **Governance protocols** preventing scope creep and ensuring accountability

The A1 system has since evolved beyond the architecture used for this project. For the full framework, see:

> **[ChronicleCore-Architecture](https://github.com/Zaious/ChronicleCore-Architecture)** — Enterprise multi-agent orchestration framework
