---
name: i18next locale type safety
description: How to type locale files so translated strings pass TS checks without matching English literals.
---

## The rule

Export `Translations` as `DeepString<typeof en>`, not `typeof en`:

```ts
type DeepString<T> = { [K in keyof T]: T[K] extends Record<string, unknown> ? DeepString<T[K]> : string };
export type Translations = DeepString<typeof en>;
```

**Why:** `typeof en` with `as const` creates literal string types for every value. Other locale files importing `Translations` then fail TS checks because their translated strings don't match the English literals (e.g. `"Speichern"` is not assignable to `"Save"`). The `DeepString` utility recursively maps all leaf values to `string`, enforcing structure (keys) without enforcing values.

**How to apply:** Any time a new locale file is added and imports `type { Translations }` from `en.ts`, check that `en.ts` uses `DeepString<typeof en>` not `typeof en`. Without this, all 8 non-English locales produce hundreds of TS errors.

## Timer variable naming

Never name a `setInterval`/`setTimeout` return variable `t` inside a component that uses `const { t } = useTranslation()`. TypeScript sees the inner `const t = setInterval(...)` as shadowing the hook's `t`, and closures that call `t(...)` will fail with "Type 'Number' has no call signatures".

**Fix:** Name timers `timer`, `intervalId`, or anything other than `t`.
