# Contributing Guide

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commitlint
enforces the format via a `commit-msg` git hook — an invalid message will block the commit.

### Format

```
type(scope): short description

[optional body — what and why, not how]

[optional footer — BREAKING CHANGE or issue refs]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `refactor` | Code restructuring with no behaviour change |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `chore` | Tooling, config, maintenance (no src change) |
| `ci` | CI pipeline changes |

### Scopes (optional)

| Scope | Area |
|-------|------|
| `components` | React UI components |
| `api` | REST / WebSocket clients |
| `hooks` | Custom React hooks |
| `context` | React context providers |
| `workers` | Web Worker implementations |
| `utils` | Utility functions |
| `types` | TypeScript type definitions |
| `pages` | Route-level page components |
| `build` | Build tooling (Vite, tsconfig) |
| `deps` | Dependency updates |
| `docs` | Documentation files |
| `config` | Runtime configuration |
| `i18n` | Internationalisation |
| `tests` | Test infrastructure |

### Rules

- **Header max 100 characters** — keep the first line tight.
- **Subject in lower-case** — `add dark mode` not `Add Dark Mode`.
- **No trailing period** on the subject.
- **Body explains what and why** — the diff already shows how.
- **Blank line before body** and before footer.

### Breaking Changes

Put a `BREAKING CHANGE:` token in the footer (or append `!` after the type/scope):

```
feat(api)!: remove legacy /v1 price endpoint

BREAKING CHANGE: The /v1/prices route has been removed.
Migrate to /api/prices (see DEPLOYMENT.md §4).
```

### Issue References

```
fix(components): price card flashes on every render

Memoised the onClick handler so PriceCard.memo() is not defeated.

Closes #42
```

### Examples

```bash
# Feature with scope
feat(hooks): add useWorkerExport hook for CSV offloading

# Bug fix
fix(api): retry WebSocket connection on 1006 close code

# Docs
docs(docs): add DEPLOYMENT.md

# Chore (no scope needed)
chore: update husky to v9

# Breaking change
feat(api)!: replace polling with WebSocket-only mode

BREAKING CHANGE: VITE_POLL_INTERVAL env var is no longer respected.
```

## Development Workflow

1. Fork and create a feature branch off `main`.
2. Make your changes; verify with:
   ```bash
   npm run typecheck   # zero TS errors
   npm run lint        # zero lint errors
   npm run test:run    # all unit tests pass
   npm run build       # production build succeeds
   ```
3. Commit using the Conventional Commits format above.
4. Open a pull request against `main`.

## Git Hooks

| Hook | Trigger | What it checks |
|------|---------|----------------|
| `commit-msg` | Every commit | Commitlint — enforces Conventional Commits format |
| `pre-commit` | Every commit | lint-staged — ESLint + Prettier on staged files |
| `pre-push` | Every push | Full build + unit test suite |
