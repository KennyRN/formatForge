# storyForge Formatting API (v8)

formatForge uses storyForge's host API as an optional runtime dependency. API v2
is the formatting baseline; v8 is the current contract.

## Access and compatibility

```ts
const sf = app.plugins.getPlugin("storyforge");
if (!sf?.api || sf.api.version < 2 || !sf.api.formatting) return;
const formatting = sf.api.formatting;
```

Capabilities added after v2 are feature-detected by method presence:

| Host API | Addition |
|---|---|
| v2 | Companion registration, linked settings, palette and style variables |
| v3 | Top-level companion panels |
| v4 | Save dated formatting export |
| v5 | List/read dated settings exports |
| v6 | Save/list/read named formatting presets |
| v7 | Rename/delete presets and explicit overwrite |
| v8 | Validated batched linked updates |

## Shared linked-key contract

storyForge's `hostApi.ts` `LINKED_FORMATTING_KEYS` is the source of truth.
`npm run sync:formatting-contract` in storyForge generates:

`formatForge/src/storyforgeLinkedFormattingKeys.generated.ts`

`npm run check:formatting-contract` verifies parity. Do not hand-edit the generated
file. The current contract contains 197 keys.

## Companion registration

```ts
const unregister = formatting.registerCompanion({
  pluginId: "formatforge",
  version: 1,
  openSettings: () => {},
  onHostStylesApplied: () => {},
  resolveFont: (familyId, weight) => ({ family, variation }),
  registerFacesForDocument: (doc) => {},
});
```

Only one formatting companion is active. A new registration replaces the old
registration. Call the returned disposer on unload.

## Linked settings

```ts
formatting.getLinkedSettings();
formatting.getLinkedSetting(key);

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
one linked-style refresh.

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
await formatting.deleteFormattingPreset(path);
```

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
| storyForge | Palette, panel chrome, highlights, sizes, guides and scrollbar |
| formatForge | Editor colours, fonts, small caps, dividers and H1 link styling |

When formatForge is enabled, storyForge intentionally removes its formatting
transfer UI and points users to formatForge. Standalone storyForge keeps its
fallback Themes UI when formatForge is absent.
