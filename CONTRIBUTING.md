# Contributing to Hotella

Thanks for your interest in contributing! This guide covers the development workflow.

## Prerequisites

- **Node.js 22+** (check with `node --version`)
- **pnpm** (install via `npm install -g pnpm`)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/crcatala/hotella.git
cd hotella

# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run CLI in development mode (via tsx) |
| `pnpm test` | Run unit tests |
| `pnpm lint` | Run linter (oxlint) |
| `pnpm format` | Format code (prettier) |
| `pnpm typecheck` | Type check (tsgo) |
| `pnpm verify` | **Run all checks** — this is the CI gate |

The `verify` script is the single source of truth for CI. If it passes locally, your PR will pass CI.

Add `:verbose` to any command for detailed output (e.g., `pnpm test:verbose`).

## Project Structure

```
src/
├── cli/          # CLI infrastructure (program, output, errors, spinner)
├── commands/     # Command implementations (search)
└── lib/          # Core business logic (fetcher, parser, filters, sort)
```

## Submitting Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b your-feature-name
   ```

2. **Make your changes** and ensure they pass verification:
   ```bash
   pnpm verify
   ```

3. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push** and open a Pull Request against `main`

## Code Style

Code style is enforced automatically:

- **Linting:** [oxlint](https://oxc.rs/docs/guide/usage/linter.html) — fast Rust-based linter
- **Formatting:** [Prettier](https://prettier.io/) — consistent code formatting

Run `pnpm format` to auto-fix formatting issues before committing.

## Release Process

Releases are automated via [release-it](https://github.com/release-it/release-it).

**What happens on release:**

1. `pnpm run verify` runs all quality checks
2. Version is bumped in `package.json`
3. `CHANGELOG.md` is updated with the release date
4. Changes are committed and tagged
5. A GitHub release is created
6. Package is published to npm

**For maintainers:**

```bash
# Dry run (no changes made)
pnpm release -- --dry-run

# Publish a release
pnpm release
```

See `.release-it.json` for configuration details.
