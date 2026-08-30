# storyForge Formatting API

formatForge uses storyForge's host API as an optional runtime dependency. Host
API version 2 is the formatting baseline; version 9 is the current method
surface.

These four numbers change independently. Do not smash them into “API v9”:

| Axis | Current | Meaning |
|---|---|---|
| Host API `STORYFORGE_API_VERSION` | **9** | Methods on the host object |
| Linked-key `STORYFORGE_FORMATTING_CONTRACT_VERSION` | **11** | Shape of the linked-key list |
| Export document `FORMATTING_EXPORT_VERSION` | **3** | Portable JSON theme file |
| Companion `registerCompanion.version` | **1** | formatForge → storyForge callback schema |

Adding a linked key must bump the contract version, not the host API version.

## Access and compatibility

```ts
const sf = app.plugins.getPlugin("storyforge");
if (!sf?.api || sf.api.version < 2 || !sf.api.formatting) return;
const formatting = sf.api.formatting;
```

`getSfFormattingApi` also requires the baseline methods to exist as functions.
A host that reports a high version but is missing a method is treated as absent.
`registerViewContribution` is not part of that baseline: a formatting-only host
is accepted without it.

Capabilities added after v2 are feature-detected by method presence
(`hostSupportsBatchUpdates`, `hostSupportsThemeLibrary`, and related helpers
in `storyforgeBridge.ts`):

| Host API | Addition |
|---|---|
| v2 | Companion registration, linked settings, palette and style variables |
| v3 | Top-level companion panels; `getCompanion` |
| v4 | Save dated formatting export |
| v5 | List/read dated settings exports |
| v6 | Save/list/read named formatting presets |
| v7 | Rename/delete presets and explicit overwrite |
| v8 | Validated batched linked updates |
| v9 | Companion `onHostDisconnect(linked)` after host style strip on unload |
| — | `openInterfaceModal()` opens storyForge's own interface chrome modal (feature-detected) |

## Shared linked-key contract

storyForge's `hostApi.ts` `LINKED_FORMATTING_KEYS` is the source of truth.
`npm run sync:formatting-contract` in storyForge generates:

`formatForge/src/storyforgeLinkedFormattingKeys.generated.ts`

and copies `linked-formatting-keys.json` into this repo.

`npm run check:formatting-contract` here rebuilds the expected generated file
from that JSON and diffs it, so GitHub CI catches a stale generated copy even
when the storyForge sibling is absent. Do not hand-edit the generated file.
The current contract contains **219** keys (contract version 11).

## Companion registration

```ts
const unregister = formatting.registerCompanion({
  pluginId: "formatforge",
  version: 1,
  openSettings: () => {},
  onHostStylesApplied: () => {},
  onHostDisconnect: (linked) => {},
  resolveFont: (familyId, weight) => ({ family, variation }),
  registerFacesForDocument: (doc) => {},
});
```

Only one formatting companion is active. A new registration replaces the old
registration. Call the returned disposer on unload. Register `onHostDisconnect`
so a v9 host can restyle the companion immediately after stripping CSS vars;
the 1s keepalive poll remains the fallback for older hosts.

## Linked settings

```ts
formatting.getLinkedSettings();
formatting.getLinkedSetting("bodyTextSize"); // number
formatting.getLinkedSetting("bodyTextOverrideSize"); // boolean

// Live single-setting edits; validates, saves and restyles.
await formatting.updateLinkedSetting(key, value);

// v8 theme/import path; validates the whole patch before one save/restyle.
await formatting.updateLinkedSettings({
  bodyTextSize: 1.1,
  recommendHeaderColor: "#abcdef",
  colorPaletteName: "Custom",
});
```

Use `updateLinkedSettings` for bulk work. If any key or value is invalid, no key
is written.

Shared editor sizes use the same bounds on both sides: a finite number greater
than 0 and at most 10 (`em` multipliers). formatForge mirrors host-owned
palette/size/scrollbar values into local settings so unlinking storyForge does
not revert to a stale cache.

## Palette

```ts
formatting.getPalette();
await formatting.updatePalette({
  name,
  variant,
  customColors,
});
```

At v8, `updatePalette` delegates to the same validated batched path and triggers
one linked-style refresh. The live copy lives in storyForge; formatForge reads
through this API while linked.

## Theme storage

All vault writes are owned and guarded by storyForge:

```ts
await formatting.saveFormattingExport(json);        // _sf-backup/
await formatting.listSettingsExports();
await formatting.readSettingsExport(path);

await formatting.saveFormattingPreset(name, json, overwrite);
await formatting.listFormattingPresets();
await formatting.readFormattingPreset(path);
await formatting.renameFormattingPreset(path, newName, overwrite);
await formatting.deleteFormattingPreset(path); // archives into settings/archived-settings/
```

Named themes are stored as `_backstage/storyforge/settings/thm-Name.json`.
Other settings kinds in the same folder use `pref-`, `tytg-`, and `comp-`
prefixes and are not listed by this API.

formatForge must not write these paths directly.

## Style application

```ts
formatting.setStyleVars(vars);       // main document and pop-outs
formatting.applyLinkedStyles();      // rebuild storyForge-owned CSS variables
formatting.getStyleDocuments();      // documents requiring FontFace registration
```

## Ownership

| Owner | Settings |
|---|---|
| storyForge | Palette, panel chrome, highlights, sizes, cycling guide and scrollbar |
| formatForge | Editor colours, fonts, small caps, dividers and H1 link styling |

Cycling-guide keys are storyForge chrome. They belong in the
`storyForgeInterface` section of a portable theme, not in `textStyling`.

When formatForge is connected, storyForge's interface modal stays in storyForge
and gains font pickers from the companion. Editor colours, fonts, and themes
stay in formatForge. Standalone storyForge keeps its fallback Themes UI when
formatForge is absent.

## Status of the 2026-08-05 audits

[`docs/api-audit-2026-08-05.md`](./api-audit-2026-08-05.md) and
[`docs/full-audit-2026-08-05.md`](./full-audit-2026-08-05.md) are historical.
They still mention 197 keys and list P1s (disconnect restyle, mirroring,
untyped local import, dropped disposers) that HEAD has already fixed. Treat
this document and the live sources as current.
