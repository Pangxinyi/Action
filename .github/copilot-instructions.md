<!-- Copilot / AI agent instructions for the Action app -->
# AI Coding Assistant Guide

This repository is an Expo (React Native + web) app using `expo-router` and TypeScript. Below are focused, actionable notes to help an AI coding agent be immediately productive.

## Quick commands
- Install deps: `npm install`
- Start dev server: `npx expo start` (then open iOS/Android/web or Expo Go)
- Lint: `npm run lint`

## High-level architecture
- Entry: `package.json` sets `main` to `expo-router/entry` — the app uses file-based routing under `app/`.
- UI surface: Most app UI lives in `app/` (example: `app/index.tsx` contains the current main screen). Treat `app/` as the primary product code.
- Shared UI & helpers: `components/` and `components/ui/` contain reusable controls (e.g., `collapsible.tsx`, `icon-symbol.tsx`, `icon-symbol.ios.tsx`, `themed-text.tsx`, `themed-view.tsx`). Prefer adding shared UI here.
- Hooks and constants: `hooks/` and `constants/` hold cross-cutting utilities (see `use-color-scheme.ts`, `use-color-scheme.web.ts`, `use-theme-color.ts`, and `constants/theme.ts`). Check platform-specific hook variants.
- Assets: `assets/images/` for static media.

## TypeScript & module resolution
- TypeScript `strict` is enabled in `tsconfig.json` and path aliases are defined:
  - `@components/*` -> `components/*`
  - `@hooks/*` -> `hooks/*`
  - `@constants/*` -> `constants/*`
- Babel `module-resolver` is configured in `babel.config.js` with the same aliases — ensure any changes to aliases are kept in both places.

## Project-specific patterns & conventions
- File-based routing: Follow Expo Router conventions — pages and layouts live under `app/`.
- Platform overrides: The repo uses platform-specific filenames (example: `icon-symbol.ios.tsx`, `use-color-scheme.web.ts`) — prefer that pattern for platform-specific implementations.
- Themed primitives: Use `themed-text.tsx` and `themed-view.tsx` when adding visual elements to remain consistent with the app theme.
- Single-file screens: `app/index.tsx` is a large example screen mixing UI, state, and helpers. When adding new screens, prefer smaller components under `components/` and keep `app/` routes thin.

## Integration points & notable deps
- Expo ecosystem: `expo`, `expo-router`, `expo-constants`, `expo-splash-screen`, `expo-status-bar`, `expo-web-browser`, `expo-image`.
- Navigation: `@react-navigation/*` packages are present; rely on `expo-router` for routing patterns.
- Gesture & animation: `react-native-gesture-handler`, `react-native-reanimated`, and `react-native-worklets` are included — expect native build steps for custom dev clients if you modify native behavior.
- Icons: `lucide-react-native` is used for icons (see `app/index.tsx` top imports).

## Developer workflows & gotchas
- No test runner configured: There are no test scripts in `package.json`. Do not assume existing unit tests.
 - Reset behavior: (developer reset script removed) previously used to interactively move `app`, `components`, `hooks`, `constants`, and `scripts` to `app-example`.
- Linting: `expo lint` is available as `npm run lint`.
- Native deps: When adding/upgrading native modules (e.g., reanimated), follow Expo docs for managed workflow or use a custom dev client.

## Where to look first (quick links)
- App entry / main screen: `app/index.tsx`
- Shared UI: `components/` and `components/ui/`
- Hooks: `hooks/` and platform-specific variants `use-color-scheme.web.ts`
- Aliases/config: `tsconfig.json`, `babel.config.js`
 - Scripts: (no destructive reset script included)
- Package manifest: `package.json`

## Example tasks and how to perform them
- Add a new routed screen: create `app/new-screen.tsx` (export default React component). Use `components/` for subcomponents and import via alias: `import X from '@components/x'`.
- Add a new shared hook: create file under `hooks/` and add platform variant with `.web.ts` suffix if needed.

If anything looks incorrect or you want deeper coverage (build matrix, CI, or native config notes), tell me what to expand and I'll update this file.
