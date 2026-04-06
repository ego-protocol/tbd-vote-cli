# CLAUDE.md

## Versioning

This project follows [semver](https://semver.org/). Version must be updated in **both** files:

- `package.json` → `"version"`
- `src/index.ts` → `.version()`

Rules:

- **Patch** (0.1.x): bug fixes, small improvements, doc updates, type fixes
- **Minor** (0.x.0): new commands, new config options, new features
- **Major** (x.0.0): breaking changes to CLI interface or config format

## Build & Test

```bash
pnpm build        # compile to dist/
pnpm test         # run all tests
pnpm dev          # watch mode
```

## Project Structure

- `src/commands/` — CLI command implementations
- `src/lib/` — shared modules (api client, config, output formatting, constants)
- `src/types.ts` — TypeScript interfaces matching backend API responses
- `AGENTS.md` — agent onboarding doc (also served from tbd.vote/agents.md)
