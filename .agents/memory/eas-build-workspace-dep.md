---
name: EAS build workspace dependency fix
description: Why all EAS builds failed with JS bundle error and how to fix it permanently
---

## The problem
EAS build uses `EAS_NO_VCS=1` and uploads from `artifacts/mobile/` only. The mobile app had `"@workspace/api-client-react": "workspace:*"` in package.json, which is a pnpm workspace symlink pointing to `../../lib/api-client-react/`. EAS never uploads `lib/`, so Metro can't resolve the package → bundle fails with exit code 1.

This caused ALL builds (1–5) to fail with: `pnpm expo export:embed --eager --platform android --dev false exited with non-zero code: 1`

## The fix
1. Copy `lib/api-client-react/src/` into `artifacts/mobile/lib/api-client-react/src/`
2. Add to `metro.config.js`:
   ```js
   config.resolver.extraNodeModules = {
     "@workspace/api-client-react": path.resolve(__dirname, "lib/api-client-react/src"),
   };
   ```
3. Add to `tsconfig.json` paths:
   ```json
   "@workspace/api-client-react": ["./lib/api-client-react/src/index.ts"]
   ```
4. Remove tsconfig `references` entry pointing to `../../lib/api-client-react`
5. Remove `"@workspace/api-client-react": "workspace:*"` from `package.json`

**Why:** Metro resolves `extraNodeModules` before `node_modules`, so the local copy takes priority. The local copy is uploaded by EAS with the rest of the app.

## Important maintenance rule
When `lib/api-client-react` is regenerated via `pnpm --filter @workspace/api-spec run codegen`, you must also copy the updated generated files into `artifacts/mobile/lib/api-client-react/src/generated/`:
- `api.ts`
- `api.schemas.ts`

The `custom-fetch.ts` and `index.ts` files rarely change so don't need copying unless deliberately modified.
