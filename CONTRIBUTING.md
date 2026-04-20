# Contributing to Antigravity: Skills Chronicle

Thank you for your interest in contributing! This project is community-maintained — the original author ([Zaious](https://github.com/Zaious)) reviews PRs and publishes approved changes to the VS Code Marketplace.

## Getting Started

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Zaious/Antigravity-Skills-Chronicle.git
cd Antigravity-Skills-Chronicle

# Install extension dependencies
npm install

# Install web UI dependencies
cd web && npm install && cd ..

# Build the extension
npm run bundle

# For development with watch mode
npm run watch
```

### Testing Locally

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. The extension will activate in the new VS Code window

## How to Contribute

### Reporting Bugs

- Use the [Bug Report](https://github.com/Zaious/Antigravity-Skills-Chronicle/issues/new?template=bug_report.md) template
- Include your VS Code version and OS
- Describe steps to reproduce the issue

### Suggesting Features

- Use the [Feature Request](https://github.com/Zaious/Antigravity-Skills-Chronicle/issues/new?template=feature_request.md) template
- Explain the use case and expected behavior

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Ensure the build passes: `npm run bundle`
5. Submit a PR with a clear description of what changed and why

### Project Structure

```
src/                    # VS Code Extension backend (TypeScript)
├── extension.ts        # Main entry — message handling, webview setup
├── core/               # History extraction, indexing
├── providers/          # TreeView data providers
└── remote-bridge/      # Discord & Telegram integration

web/                    # Webview frontend (React + Vite + Tailwind)
└── src/
    ├── App.tsx         # Main dashboard component
    ├── components/     # UI components
    └── hooks/          # React hooks
```

### Known Areas for Improvement

- `extension.ts` is a large single file (~52K) — refactoring into modules is welcome
- `web/src/App.tsx` is similarly large (~105K) — component extraction would help
- Gemini API changes may break conversation history parsing
- Test coverage is minimal

## Code Style

- TypeScript strict mode
- No `any` types
- Meaningful commit messages (conventional commits preferred)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
