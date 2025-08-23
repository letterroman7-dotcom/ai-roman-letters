# Restore System (A`I project / Phase-A)

**Purpose:** Create and manage lightweight snapshots (env + metadata) to help recover configuration quickly during incidents.

## What it captures

- .env (if present)
- package.json summary (name, version, scripts)
- timestamp + host info

## Commands

- `restore:snapshot` → writes `data/restore/checkpoints/<TS>.json` (and `<TS>.env` if `.env` exists)
- `restore:list` → [{ id, files, createdAt }]
- `restore:apply <id>` → copies checkpoint .env → project `.env` (safe, atomic)
- `restore:delete <id>` → removes checkpoint files
