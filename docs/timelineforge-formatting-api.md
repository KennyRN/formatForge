# timelineForge Formatting API (version 1)

formatForge registers as a **typography companion** on timelineForge. Unlike
storyForge (where formatForge owns separate Text Style / Interface modals),
timelineForge keeps font controls **inside** its Timeline appearance modal.
formatForge supplies the font catalogue, FontFace registration, resolution, and
the Pick font modal.

Access the API via:

```ts
const tf = app.plugins.getPlugin("timelineforge");
if (!tf?.api || tf.api.version < 1) return;
const formatting = tf.api.formatting;
```

---

## registerCompanion

```ts
formatting.registerCompanion(reg: FormatCompanionRegistration): () => void
```

Registers formatForge as the active typography companion. Only one companion is
active at a time; a new registration replaces the previous one. Returns an
**unregister** function — call it in `onunload`.

```ts
interface FormatCompanionRegistration {
  pluginId: string;           // "formatforge"
  version: number;            // companion schema version (currently 1)
  resolveFont?: (familyId: string, weight: number) =>
    { family: string; variation: string | null } | null;
  registerFacesForDocument?: (doc: Document) => void;
  listFonts?: () => Array<{
    id: string;
    label: string;
    weightMin: number;
    weightMax: number;
  }>;
  openFontPicker?: (opts: {
    currentFamilyId: string;
    previewFontSizeEm: number;
    onPick: (familyId: string) => void;
  }) => void;
  onHostStylesApplied?: () => void;
}
```

---

## Ownership split

| Concern | Owner | Storage |
|---|---|---|
| Rail colours (line, parent fill/text, highlight) | timelineForge | `_tf-backstage/folders/*.md` |
| Font size / family / weight per text role | timelineForge | same folder bounds note |
| Custom font binaries + FontFace registration | formatForge | bundled in formatForge |
| Font picker UI | formatForge (`FontPickerModal`) | opened from TF appearance modal |

Text roles in the appearance modal:

- Parent event heading (colour already on Parent event text)
- Event title (colour uses theme `--text-normal`)
- Event date
- Year number division (no colour control — inherits line colour)
- Month division (no colour control — inherits line colour)

---

## Soft dependency

timelineForge works without formatForge: colours and size sliders still apply;
custom font pickers show an install hint. With formatForge enabled, Override
theme font reveals Pick font + weight.
