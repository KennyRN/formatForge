A simple to use obsidian plugin which adds simple colour selectors and inbuilt fonts

# formatForge

**formatForge** is a companion plugin for [storyForge](https://github.com/volcanicMole/storyforge) that owns all editor typography settings.

## Requirements

- storyForge plugin (API version 2+) must be installed and enabled.
- Obsidian 1.13.0 or later.
- Desktop only.

## What formatForge owns

- Editor **body and heading colours** (H1–H6)
- Editor **font families and weights** (H1–H6 and body)
- **Heading dividers** — configurable border lines above/below each heading level
- **Hide H1 links** — renders links inside H1 as plain text
- **Small caps** per heading level
- **Bold and italic emphasis colours** for body text
- The full **Text Styling** modal UI

## What it shares with storyForge

- **Font sizes** (body and heading H1–H6) are stored in storyForge's `data.json` and exposed via the linked-settings API.
- **Palette** (name, variant, custom colours) lives in storyForge but is read/written via `formatting.updatePalette`.
- **storyForge panel chrome** (library, unplaced, codex, cycling guide, highlights, scrollbar) is managed through the storyForge Interface modal, which writes back to storyForge via `formatting.updateLinkedSetting`.

## How it registers with storyForge

On load, formatForge calls:

```ts
app.plugins.getPlugin("storyforge")?.api.formatting.registerCompanion({
  pluginId: "formatforge",
  version: 1,
  onHostStylesApplied: () => plugin.applyEditorStyles(),
  resolveFont: (familyId, weight) => resolveCustomFontFamilyParts(font, weight),
  registerFacesForDocument: (doc) => registerCustomFontFaces(doc),
});
```

storyForge will then:
- Hide its own formatting settings tab entry.
- Call `onHostStylesApplied` after each SF restyle so FF can refresh editor CSS vars.
- Call `resolveFont` / `registerFacesForDocument` when it needs font information for SF panel chrome.

## How it registers with timelineForge

formatForge also soft-depends on [timelineForge](https://github.com/KennyRN/timelineForge).
Font controls for the timeline rail live **inside** timelineForge's Timeline
appearance modal (not a separate formatForge modal). On load:

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

See `docs/timelineforge-formatting-api.md`.

## Settings storage

| Setting group | Persisted in |
|---|---|
| Editor body/heading colours, fonts, dividers, H1 link hiding | `formatForge/data.json` |
| Font sizes (body + H1–H6) | `storyForge/data.json` (via linked settings API) |
| Colour palette | `storyForge/data.json` (via `formatting.updatePalette`) |
| storyForge panel chrome | `storyForge/data.json` (via `formatting.updateLinkedSetting`) |
| Timeline rail colours + typography | timelineForge `_tf-backstage/folders/*.md` |
