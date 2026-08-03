# formatForge

**formatForge** adds simple typography and colour formatting to Obsidian — body and heading colours, fonts, dividers, and related styling UI.

It works **on its own** for any vault that wants clearer note formatting. It also soft-integrates with the **Forge plugin family** (storyForge, timelineForge, and others that adopt the formatting API) so those plugins can share fonts, palettes, and styling through formatForge.

## Requirements

- Obsidian 1.13.0 or later.
- Desktop only.
- Forge hosts (storyForge, timelineForge, …) are **optional**. When present, formatForge registers as their typography companion; when absent, editor formatting still applies from formatForge’s own settings.

## What formatForge owns

- Editor **body and heading colours** (H1–H6)
- Editor **font sizes** (body + H1–H6) when running alone
- Editor **font families and weights** (H1–H6 and body)
- **Heading dividers** — configurable border lines above/below each heading level
- **Hide H1 links** — renders links inside H1 as plain text
- **Small caps** per heading level
- **Bold and italic emphasis colours** for body text
- **Link colour and underline** controls for body links
- **Highlight colours** (background + text) for `==highlighted==` marks
- The full **Text Styling** modal UI, including a live Lorem Ipsum manuscript preview
- **Colour palette** selection (and Custom swatches) for formatting colour pickers when running alone
- **Manuscript editor scrollbar** thumb colour and thickness
- Embedded custom fonts (`fonts/` + `src/fonts.ts`)

## Forge family integration

When a Forge host is enabled, formatForge can also adjust that host’s formatting surface:

| Host | What formatForge contributes |
|---|---|
| **storyForge** | Registers as formatting companion; applies editor CSS vars; shared palette / sizes / scrollbar; panel chrome (library, unplaced, codex, cycling guide) via the storyForge interface modal |
| **timelineForge** | Font catalogue, font picker, and face registration for the timeline rail (controls live in timelineForge’s appearance UI) |

Hosts are detected at runtime. Missing hosts are ignored — there is no required-plugin warning.

## How it registers with storyForge

When storyForge API v2+ is available:

```ts
app.plugins.getPlugin("storyforge")?.api.formatting.registerCompanion({
  pluginId: "formatforge",
  version: 1,
  onHostStylesApplied: () => plugin.applyEditorStyles(),
  resolveFont: (familyId, weight) => resolveCustomFontFamilyParts(font, weight),
  registerFacesForDocument: (doc) => registerCustomFontFaces(doc),
});
```

## How it registers with timelineForge

```ts
app.plugins.getPlugin("timelineforge")?.api.formatting.registerCompanion({
  pluginId: "formatforge",
  version: 1,
  resolveFont: (familyId, weight) => resolveCustomFontFamilyParts(font, weight),
  registerFacesForDocument: (doc) => registerCustomFontFaces(doc),
  listFonts: () => CUSTOM_FONTS.map(...),
  openFontPicker: (opts) => new FontPickerModal(...).open(),
});
```

See `docs/timelineforge-formatting-api.md` and `docs/storyforge-formatting-api.md`.

## Settings storage

| Setting group | Persisted in |
|---|---|
| Editor body/heading colours, fonts, sizes, dividers, H1 link hiding, body links, highlights | `formatForge/data.json` |
| Colour palette (name, variant, custom colours) | `formatForge/data.json` standalone; `storyForge/data.json` when storyForge is present |
| Font sizes (body + H1–H6) | `formatForge/data.json` standalone; `storyForge/data.json` when storyForge is present (linked settings API) |
| Manuscript editor scrollbar | `formatForge/data.json` standalone; `storyForge/data.json` when storyForge is present |
| storyForge panel chrome | `storyForge/data.json` via linked settings |
| Timeline rail colours + typography | timelineForge `_tf-backstage/folders/*.md` |
