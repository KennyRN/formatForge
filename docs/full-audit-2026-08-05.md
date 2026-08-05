# formatForge full-codebase audit — 2026-08-05

Full pass over `src/` (~6.8k non-test lines), `styles.css`, tests (34), release workflow, and cross-checks against storyForge host behaviour. Prior API-only findings in [`api-audit-2026-08-05.md`](./api-audit-2026-08-05.md) are folded in and re-verified.

Method: live source review (not a vault soak). All 34 tests pass at audit time.

---

## Executive summary

formatForge is a well-structured soft-connected companion: local editor typography in `data.json`, storyForge-owned chrome/sizes/palette via the host API, and theme archives/presets only through storyForge write APIs. Soft-connect, theme section ownership, and export/import stress coverage are real strengths.

No P0 security/XSS issues were found (no `innerHTML` / `eval` sinks; fonts resolve only from the catalog). Highest impact defects are **operational**:

1. Soft-disconnect does not restyle after storyForge clears `--sf-*` vars.
2. Live SF-owned UI edits are not mirrored into FF local settings.
3. Local import/load accept untyped values that can persist broken CSS.

---

## Strengths

- Clear persistence split and bridge isolation (`storyforgeBridge.ts`, `timelineForgeBridge.ts`) with no compile-time storyForge dependency.
- Soft-connect with keepalive poll + layout-change + API-identity rebind (`hostConnectRetry.ts`, `main.ts`).
- Theme apply order: host-validated writes before local persist; empty apply rejected; unknown host keys intersected with live `getLinkedSettings()` (`formattingImport.ts`).
- Optional capability gating in `FormattingExportModal` (preset / archive / rename / delete).
- Generated 197-key contract (`storyforgeLinkedFormattingKeys.generated.ts`, contract version 8); track colour intentionally retired.
- Shared modal helpers reduce Text/UI duplication inside FF.
- Preview samples use text nodes / Obsidian APIs — no HTML string injection.
- Solid automated coverage for export/import ownership and disconnect cycles (34 tests).

---

## Findings

### P0

None.

### P1

#### 1. Soft-disconnect leaves typography uncleared / unrestored

`src/main.ts` (~425–433, ~135–203) + storyForge `styleController.clearAll()` / unload.

While connected, `applyEditorStyles` writes via `sfApi.setStyleVars` only (no local body apply). On storyForge unload, SF clears every `--sf-*` on style docs. FF’s null soft-connect path then abandons API refs and returns `false` without calling `applyEditorStyles()`.

**Effect:** Disable/unload storyForge while formatForge stays enabled → body/heading colours, fonts, and sizes disappear until a modal/import/reconnect restyles.

#### 2. Live SF-owned edits not mirrored into `ffSettings`

`src/main.ts` (`updatePalette`, `updateEditorScrollbar`, size paths) and Text Style modal.

While connected, palette / size / scrollbar writes go only to storyForge. Theme **apply** dual-writes via `importTextStylingSettings`; **UI-edit-then-disconnect** falls back to stale local palette/sizes/scrollbar.

#### 3. Untyped local import / load can corrupt persisted settings

`src/main.ts` `importTextStylingSettings` / `loadSettings`.

Import only checks object shape, `DEFAULT_SETTINGS` keys, and `customPaletteColors` array-ness. `loadSettings` spreads `data.json` with no coercion. Bad theme JSON can store non-booleans, non-numbers, invalid enum thicknesses, etc. Invalid thickness then produces `undefinedpx solid …` in live CSS vars. storyForge validates linked keys; formatForge does not validate its own.

#### 4. Soft-connect null path drops disposers without invoking them

`src/main.ts` (~428–433).

If `getSfFormattingApi()` returns null while the previous SF instance is still alive (version gap, partial API, brief hole), FF abandons `unregisterCompanion` / view contribution disposers. storyForge can keep believing a companion is registered. Combined with (1), twinning state diverges.

### P2

#### 5. Font registration race + deferred WeakSet

`src/fonts.ts`. `fontFacesRegisteredFor.add(doc)` runs after `await Promise.all(loads)`. Concurrent registration (connect + apply + modal open) can decode ~3MB base64 and register faces multiple times. Blob URLs are never revoked.

#### 6. Unused `fonts/` files; catalog embeds base64 only

Runtime always base64→Blob. Shipping weight is duplicated (`fonts/` on disk + embedded catalog → `main.js` ~3.3MB).

#### 7. `getSfFormattingApi` gates on version ≥ 2 only

`src/storyforgeBridge.ts`. Theme UI feature-detects methods (good), but soft-connect treats any v2+ `formatting` object as a full companion. No shared `hasThemeLibrary` / capability helpers.

#### 8. Bridge omits `getCompanion`

Typed mirror incomplete vs storyForge `formattingApi.ts`; unused today.

#### 9. No-op `storyforge-panel` view contribution

`src/main.ts` registers an empty render on every rebind — churn without UX value.

#### 10. Theme library dropdown async race

`src/view/FormattingExportModal.ts`. `Promise.all(list…)` may mutate a dropdown already destroyed by `render()`.

#### 11. Cross-plugin apply non-atomicity (residual)

`src/formattingImport.ts`. API v8 batches the host side. If host succeeds and local `saveData` fails, no rollback.

#### 12. Open modals don’t track soft-connect mid-flight

Text Style / UI Formatting capture ownership at open. Export modal re-reads API on each render (better).

#### 13. Scrollbar inline styles on scrollers survive SF `clearAll`

`--scrollbar-*` / thickness classes on `.cm-scroller` are not cleared by SF unload or FF’s null path.

#### 14. Duplicated twin surfaces with storyForge

Near-copies of palettes, style modal helpers, UiFormattingModal, TextStyleModal, PalettePickerModal. Drift risk is ongoing.

### P3

- Apply defense-in-depth for interface section (palette already stripped; size keys rely on parse).
- Companion registration `version: 1` never bumps.
- Dual Confirmation / NamePrompt modals vs storyForge ProtectionsModal.
- Courier Prime marked fixed-weight but ships Bold faces.
- Export section toggles full-remount the modal (focus loss); import toggles don’t.
- Command “Open storyForge interface styles” always available when settings row is hidden without SF.
- Release workflow builds only — no `vitest` / contract check on PR.
- `updateSetting` accepts arbitrary keys and can pollute `data.json`.

---

## Test gaps

| Gap | Why it matters |
|-----|----------------|
| Soft-disconnect → restyle | P1 #1 untested; stress test copies the buggy null path |
| Mirror-on-unbind / live palette→local | P1 #2 |
| `importTextStylingSettings` type validation | P1 #3 |
| Concurrent `registerCustomFontFaces` | P2 #5 |
| Modal open across connect/disconnect | P2 #12 |
| Plugin `onload`/`onunload` integration | No plugin-level harness |
| `check:formatting-contract` in CI | Still open |

Existing coverage is strong for pure export/import combinatorics and bridge gating. Weak on plugin lifecycle and soft-connect failure modes.

---

## Architecture notes

```
FormatForgePlugin
├── ffSettings (data.json) — colours, fonts, dividers, H1-link hide, local palette/sizes fallback
├── sfApi? — linked chrome, sizes, guides, scrollbar, shared palette, themes
├── tfApi? — font resolve / picker for timelineForge
├── applyEditorStyles — SF setStyleVars XOR local body vars
└── view/* — TextStyleModal, UiFormattingModal, FormattingExportModal, pickers
```

- Module boundaries are mostly clean; `main.ts` is the style-application hub (acceptable at this size).
- `fonts.ts` dominates bundle size and should be treated as a build/asset concern.
- Twin CSS class prefixes (`sf-*` and `ff-*`) are intentional for preview reuse of SF chrome.
- storyForge treats “formatForge enabled” as companion-active for settings UI even before `registerCompanion` — good for load order, bad if FF is enabled but soft-connect never succeeds.

---

## Soft-connect / twinning risks

| Scenario | Risk |
|----------|------|
| SF unloads, FF stays | Typography cleared by SF; FF does not re-apply locally (**P1**) |
| Live UI edits then SF disables | Stale FF palette/sizes/scrollbar (**P1**) |
| Null API without disposer call | SF may still mark companion active (**P1**) |
| FF enabled, SF not yet connected | SF hides native formatting UI; user must use FF (by design; brief gap) |
| Hot-reload new API identity | Handled: unregister + rebind + restyle |
| Theme apply host OK / local save fail | Divergent SF vs FF snapshot (**P2**) |
| Duplicate SF↔FF modal/palette code | Behaviour drift over time (**P2**) |

---

## Prior `api-audit-2026-08-05.md` status

| Prior item | Status |
|------------|--------|
| Linked-key contract drift / track colour | **Resolved** (197-key generated contract; track colour retired) |
| Host docs updated to v8 | **Resolved** |
| Theme apply batch atomicity (v8) | **Mostly resolved**; residual local-save failure remains |
| Live SF writes not mirrored into FF | **Still open (P1)** |
| Soft-connect null path drops disposers | **Still open (P1)** — compounded by missing restyle |
| Local import untyped values | **Still open (P1)** |
| Version gate vs capability helpers | **Still open (P2)** |
| Bridge omits `getCompanion` | **Still open (P2)** |
| No-op view contribution | **Still open (P2)** |
| Dual confirm/rename modals | **Still open (P3)** |
| Companion `version: 1` | **Still open (P3)** |
| `check:formatting-contract` + tests in CI | **Still open** |

---

## Suggested fix order

1. On soft-disconnect: invoke disposers if present, then `applyEditorStyles()` / scrollbar clear via the local path.
2. Mirror SF palette + size + scrollbar into `ffSettings` on write (or snapshot on unbind).
3. Validate/coerce FF settings on import and load (enums, numbers, hex, booleans).
4. Fix font registration: mark doc registered synchronously (or in-flight promise map); consider loading from `fonts/` instead of base64.
5. Add lifecycle tests for disconnect/reconnect restyle and mirror behaviour; run tests + contract check in CI.
