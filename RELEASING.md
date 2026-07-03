# Releasing

This file is the internal release checklist for `@donugr/dgradmobbridge`.

## Objective

Publish a clean plugin package without accidentally shipping unstable repository clutter or stale build output.

## Pre-Release Checks

### 1. Working tree

Confirm:

- intended files are committed
- no accidental local-only files are staged
- `README.md` reflects the current public contract
- `CHANGELOG.md` contains the release entry

### 2. Version

Update `package.json` version intentionally.

Recommended rule during early development:

- patch for bugfix or docs-only correction
- minor for meaningful public contract growth
- avoid changing public method names casually

### 3. Build

Run:

```bash
npm run build
```

Expected:

- TypeScript build succeeds
- `dist/` reflects the current source

### 4. Package audit

Run:

```bash
npm pack --dry-run
```

Verify:

- only expected publish files are included
- no `.git`, local caches, or accidental debug files
- `README.md`, `LICENSE`, and `CHANGELOG.md` are present

### 5. Consumer sanity check

Before a meaningful public release, prefer verifying with at least one real consumer app:

- install plugin
- run `npx cap sync`
- call `configure()`
- verify one standard ad path
- verify one native ad lifecycle path on Android

## Suggested Command Sequence

```bash
npm run release:check
git status
git add .
git commit -m "release: prepare vx.y.z"
git tag vx.y.z
npm publish
```

## After Publish

1. confirm package is visible on npm
2. push commit and tag to GitHub
3. verify GitHub README renders correctly
4. if needed, create GitHub release notes from `CHANGELOG.md`

## Do Not Publish If

- `build` fails
- `npm pack --dry-run` contains unexpected files
- README examples no longer match the actual contract
- Android real-device validation has not been rechecked after major bridge changes
