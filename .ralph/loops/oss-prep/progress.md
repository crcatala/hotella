# Ralph Progress Log: oss-prep
Started: 2026-01-27T23:36:06.388Z

## Codebase Patterns
- If verification fails with "Cannot find module" errors after branch switch, do `rm -rf node_modules && pnpm install` to fix

---

## [2026-01-28 07:59] - hot-b5cc
- Added MIT LICENSE file with copyright 2026 crcatala
- Added `"license": "MIT"` field to package.json (after description)
- Files changed: LICENSE (new), package.json
- **Learnings:** Switching branches may leave stale node_modules; clean reinstall fixes module resolution issues
---
