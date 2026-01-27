# Guardrails: oss-prep

## Project constraints

- **Package manager:** pnpm (not npm, yarn, or bun)
- **Linter:** oxlint (not eslint)
- **Formatter:** prettier
- **Test runner:** vitest
- **Dev runner:** tsx
- **Node version:** 22+
- **Module system:** ESM (`"type": "module"` in package.json)

## Git conventions

- Each task = one commit
- Commit message format: `type(scope): description` (e.g., `chore(legal): add MIT license`)
- Appropriate types: `chore`, `ci`, `docs`

## Quality gate

- `pnpm run verify` must pass after every task — this runs lint, typecheck, format check, tests, and build
- Do NOT modify existing source code behavior — this loop is about packaging, CI, and docs only
- Do NOT touch files in src/ unless specifically required (e.g., dynamic version in program.ts)

## Package safety

- Never include internal files in the npm package (no .tickets/, .ralph/, plans/, scripts/, tests/)
- The `files` field in package.json is the allowlist — only add intentional entries
- Run `npm pack --dry-run` when modifying package.json to verify contents

## GitHub Actions

- Always pin actions to SHA commits, not version tags
- Always add a version comment next to the SHA for human readability
- Use single-job workflows to minimize CI time

## Repo owner

- GitHub org/user: `crcatala` (infer from `git remote -v`)
- Use this for CODEOWNERS, repository URLs, etc.
