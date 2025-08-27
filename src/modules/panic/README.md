# Panic Mode (A`I project / Phase-A)

**Purpose:** One-switch lockdown. Uses Guardian’s `data/guardian/panic.lock` file as the single source of truth.

## Commands

- `panic:status` → { panic: true|false }
- `panic:on` → creates lock file (idempotent)
- `panic:off` → removes lock file (idempotent)

Other modules should honor this lock to suppress risky actions or elevate enforcement.
