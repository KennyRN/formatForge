# storyForge Formatting API (version 2)

Access the API via:

```ts
const sf = app.plugins.getPlugin("storyforge");
if (!sf?.api || sf.api.version < 2) return; // guard: not loaded / old version
const formatting = sf.api.formatting; // StoryForgeFormattingApi
```

---

## registerCompanion

```ts
formatting.registerCompanion(reg: FormatCompanionRegistration): () => void
```

Registers formatForge as the active typography companion. Only one companion is active at a time; a new registration replaces the previous one. Returns an **unregister** function — call it in `onunload`.

```ts
interface FormatCompanionRegistration {
  pluginId: string;           // "formatforge"
  version: number;            // companion schema version (currently 1)
  openSettings?: () => void;  // SF may call this to open FF settings
  onHostStylesApplied?: () => void; // called after SF reapplies its own styles
  resolveFont?: (familyId: string, weight: number) => { family: string; variation: string | null } | null;
  registerFacesForDocument?: (doc: Document) => void;
}
```

`onHostStylesApplied` fires after every SF restyle cycle. Use it to (re)apply FF-owned CSS vars via `setStyleVars`.

---

## Linked settings

SF-persisted settings that formatForge may read/write. Full key list in `src/storyforgeBridge.ts`.

```ts
formatting.getLinkedSettings(): Record<SfLinkedFormattingKey, unknown>
formatting.getLinkedSetting(key): unknown
formatting.updateLinkedSetting(key, value): Promise<void>  // also triggers applyLinkedStyles()
```

SF-linked keys include:
- Palette: `colorPaletteName`, `colorPaletteVariant`, `customPaletteColors`
- Editor sizes: `bodyTextOverrideSize`, `bodyTextSize`, `heading1OverrideSize` … `heading6Size`
- Panel chrome: `librarySeriesTitleFontSize`, `cyclingGuideEnabled`, `editorScrollbarThickness`, …

---

## Style application

```ts
// Apply css vars to body of main doc + every open pop-out
formatting.setStyleVars(vars: Record<string, string | null>): void

// Trigger SF's own restyle (chrome, sizes, guides, scrollbar) + notifies companion
formatting.applyLinkedStyles(): void

// Get all documents that need FontFace registration
formatting.getStyleDocuments(): Document[]
```

---

## Palette

```ts
formatting.getPalette(): { name: string; variant: string; customColors: PaletteColor[] }
formatting.updatePalette(partial: { name?, variant?, customColors? }): Promise<void>
```

---

## View contributions

```ts
formatting.registerViewContribution({
  slot: "storyforge-panel",
  orderHint?: number,
  render: (containerEl: HTMLElement) => () => void, // returns disposer
}): () => void
```

Contributes UI into the storyForge left panel. Returns an unregister function.

---

## CSS custom properties set by formatForge

formatForge calls `formatting.setStyleVars()` to apply the following vars to `document.body` (and each pop-out):

| Variable | Owner | Description |
|---|---|---|
| `--sf-body-color` | FF | Body text colour override |
| `--sf-body-family` | FF | Body font family |
| `--sf-body-variation` | FF | Body font-variation-settings |
| `--sf-body-weight` | FF | Body font-weight (static fonts only) |
| `--sf-body-bold-color` | FF | Bold emphasis colour |
| `--sf-body-italic-color` | FF | Italic emphasis colour |
| `--sf-h1-color` … `--sf-h6-color` | FF | Heading colour overrides |
| `--sf-h1-family` … `--sf-h6-family` | FF | Heading font families |
| `--sf-h1-variation` … `--sf-h6-variation` | FF | Heading variation-settings |
| `--sf-h1-weight` … `--sf-h6-weight` | FF | Heading weights (static fonts) |
| `--sf-h1-variant` … `--sf-h6-variant` | FF | `small-caps` or null |
| `--sf-h1-border-top` / `--sf-h1-border-bottom` | FF | H1 divider borders |
| `--sf-h1-link-color` / `--sf-h1-link-decoration` | FF | H1 link hiding |
| `--sf-body-size` | SF | Body font size override |
| `--sf-h1-size` … `--sf-h6-size` | SF | Heading size overrides |

All vars fall back to `revert` (= theme default) when unset.
