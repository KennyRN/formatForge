/**
 * Miniature storyForge panel mock for the storyForge interface live preview.
 * Uses the same `sf-*` classes / icon ids as the live panel so storyForge's
 * stylesheet + `--sf-*` chrome vars style it for real.
 */
import { setIcon } from "obsidian";

const ICON_SERIES = "sf-library";
const ICON_FILTER = "sf-filter";
const ICON_BOOK = "sf-book";
const ICON_TIMELINE = "sf-timeline";
const ICON_UNPLACED = "sf-archive-drawer";
const ICON_PLUS_SQUARE = "sf-plus-square";
const ICON_MINUS_SQUARE = "sf-minus-square";
const ICON_CHECK_SQUARE = "sf-check-square";
const ICON_CODEX = "sf-earth-fill";
const ICON_FOLDER_PLUS = "sf-folder-plus";
const ICON_PERSON = "sf-person-fill";
const ICON_MAP_PIN = "sf-map-pin";
const ICON_ARCHIVE = "sf-box";
const ICON_FORGE = "sf-hammer-anvil";
const ICON_FILE_PLUS = "sf-file-plus";
const ICON_EYE = "sf-eye";
const ICON_MULTIPLY_SQUARE = "sf-multiply-square";

export type RightSidebarPreviewMode = "chrome" | "novel" | "chapter" | "dossier" | "archive";

function listRow(list: HTMLElement, title: string, selected = false, subtitle?: string): HTMLElement {
	const row = list.createDiv({ cls: selected ? "sf-row sf-row-selected" : "sf-row" });
	const handle = row.createSpan({ cls: "sf-drag-handle" });
	setIcon(handle, "grip-vertical");
	const wrap = row.createDiv({ cls: "sf-row-title-wrap" });
	wrap.createSpan({ cls: "sf-row-text", text: title });
	if (subtitle) wrap.createDiv({ cls: "sf-row-subtitle", text: subtitle });
	return row;
}

function recommendRow(section: HTMLElement, label: string, iconId?: string): HTMLElement {
	const row = section.createDiv({ cls: "sf-recommend-row" });
	if (iconId) setIcon(row.createSpan({ cls: "sf-icon" }), iconId);
	row.createSpan({ cls: "sf-recommend-row-label", text: label });
	return row;
}

/** Mounts a compact library / unplaced / codex / cycling-guide sample into `container`. */
export function mountUiStylePreviewSample(container: HTMLElement): void {
	container.empty();

	const view = container.createDiv({ cls: "storyforge-view ff-ui-preview-host" });

	// ── Top: library + unplaced ────────────────────────────────────────────
	const top = view.createDiv({ cls: "sf-top-panel" });

	const header = top.createDiv({ cls: "sf-top-header" });

	const seriesLine = header.createDiv({ cls: "sf-header-line sf-series-line" });
	setIcon(seriesLine.createSpan({ cls: "sf-icon" }), ICON_SERIES);
	seriesLine.createSpan({ cls: "sf-header-text", text: "Lorem Series" });
	const seriesFilter = seriesLine.createSpan({
		cls: "sf-series-filter-btn",
		attr: { "aria-label": "Series settings" },
	});
	setIcon(seriesFilter, ICON_FILTER);

	const bookLine = header.createDiv({ cls: "sf-book-line" });
	setIcon(bookLine.createSpan({ cls: "sf-icon" }), ICON_BOOK);
	const titleRow = bookLine.createDiv({ cls: "sf-header-line sf-book-title-row" });
	const textWrap = titleRow.createDiv({ cls: "sf-book-text-wrap" });
	textWrap.createSpan({ cls: "sf-header-text", text: "Ipsum Liber" });
	const bookBtn = titleRow.createSpan({
		cls: "sf-book-filter-btn",
		attr: { "aria-label": "Synopsis and plot" },
	});
	setIcon(bookBtn, ICON_TIMELINE);
	bookLine.createDiv({ cls: "sf-book-subtitle-text", text: "Vol. I — Dolor Sit" });

	const body = top.createDiv({ cls: "sf-top-body" });
	const mainList = body.createDiv({ cls: "sf-top-list" });
	listRow(mainList, "I. Amet Consectetur");
	listRow(mainList, "II. Adipiscing Elit", true);
	listRow(mainList, "III. Sed Do Eiusmod");

	const unplacedZone = body.createDiv({ cls: "sf-unplaced-zone" });
	const unplacedHeader = unplacedZone.createDiv({ cls: "sf-unplaced-header" });
	setIcon(unplacedHeader.createSpan({ cls: "sf-icon" }), ICON_UNPLACED);
	unplacedHeader.createSpan({ cls: "sf-header-unplaced", text: "Unplaced Chapters" });
	const unplacedNew = unplacedHeader.createSpan({
		cls: "sf-unplaced-new-file",
		attr: { "aria-label": "New chapter" },
	});
	setIcon(unplacedNew, ICON_PLUS_SQUARE);
	const unplacedList = unplacedZone.createDiv({ cls: "sf-top-list sf-unplaced-list" });
	listRow(unplacedList, "Tempor Incididunt");
	listRow(unplacedList, "Ut Labore", true);

	// ── Bottom: codex ──────────────────────────────────────────────────────
	const bottom = view.createDiv({ cls: "sf-bottom-panel" });
	const bottomHeader = bottom.createDiv({ cls: "sf-bottom-header" });
	setIcon(bottomHeader.createSpan({ cls: "sf-icon" }), ICON_CODEX);
	bottomHeader.createSpan({ cls: "sf-header-codex", text: "Codex" });
	const newFileBtn = bottomHeader.createSpan({
		cls: "sf-codex-new-file-btn",
		attr: { "aria-label": "New file" },
	});
	setIcon(newFileBtn, ICON_PLUS_SQUARE);
	const newFolderBtn = bottomHeader.createSpan({
		cls: "sf-codex-new-folder-btn",
		attr: { "aria-label": "New folder" },
	});
	setIcon(newFolderBtn, ICON_FOLDER_PLUS);

	const tree = bottom.createDiv({ cls: "sf-codex-tree" });
	const folder = tree.createDiv({ cls: "sf-codex-folder" });
	const folderHeader = folder.createDiv({ cls: "sf-codex-folder-header" });
	const folderHandle = folderHeader.createSpan({ cls: "sf-drag-handle" });
	setIcon(folderHandle, "grip-vertical");
	folderHeader.createSpan({ cls: "sf-codex-chevron" });
	folderHeader.createSpan({ cls: "sf-codex-folder-name sf-styled-heading", text: "Magna Aliqua" });

	const children = folder.createDiv({ cls: "sf-codex-folder-children" });
	children.createDiv({ cls: "sf-codex-folder-indicator" });

	const noteA = children.createDiv({ cls: "sf-codex-file" });
	setIcon(noteA.createSpan({ cls: "sf-drag-handle" }), "grip-vertical");
	noteA.createSpan({ text: "Ut Enim Ad Minim" });
	setIcon(noteA.createSpan({ cls: "sf-icon sf-codex-type-icon" }), ICON_PERSON);

	const noteB = children.createDiv({ cls: "sf-codex-file sf-row-selected" });
	setIcon(noteB.createSpan({ cls: "sf-drag-handle" }), "grip-vertical");
	noteB.createSpan({ text: "Veniam Quis" });
	setIcon(noteB.createSpan({ cls: "sf-icon sf-codex-type-icon" }), ICON_MAP_PIN);

	const noteC = children.createDiv({ cls: "sf-codex-file" });
	setIcon(noteC.createSpan({ cls: "sf-drag-handle" }), "grip-vertical");
	noteC.createSpan({ text: "Nostrud Exercitation" });
	setIcon(noteC.createSpan({ cls: "sf-icon sf-codex-type-icon" }), "circle-help");
}

function mountForgePreview(rail: HTMLElement): void {
	const forge = rail.createDiv({ cls: "sf-forge-view" });
	const companions = forge.createDiv({ cls: "sf-forge-view__companions" });
	const companionA = companions.createSpan({
		cls: "sf-forge-view__companion is-active",
		attr: { "aria-label": "nameForge" },
	});
	setIcon(companionA, ICON_PERSON);
	const companionB = companions.createSpan({
		cls: "sf-forge-view__companion",
		attr: { "aria-label": "Forge" },
	});
	setIcon(companionB, ICON_FORGE);
	forge.createDiv({ cls: "sf-forge-view__panel" });
}

/**
 * Story Context panel chrome — header + Novel / Chapter / Dossier tabs.
 * Returns the panel element so each mode can mount its own body.
 */
function mountRecommendChrome(rail: HTMLElement, activeTab: "novel" | "chapter" | "dossier" | null): HTMLElement {
	const recommend = rail.createDiv({ cls: "sf-recommend-view" });
	const recHeader = recommend.createDiv({ cls: "sf-recommend-header" });
	const recHeaderMain = recHeader.createDiv({ cls: "sf-recommend-header-main" });
	setIcon(recHeaderMain.createSpan({ cls: "sf-icon" }), ICON_TIMELINE);
	recHeaderMain.createSpan({ cls: "sf-recommend-title", text: "Story Context" });
	const recActions = recHeader.createDiv({ cls: "sf-recommend-header-actions" });
	setIcon(
		recActions.createSpan({
			cls: `sf-recommend-archive-btn${activeTab === null ? " is-active" : ""}`,
			attr: { "aria-label": "Archive" },
		}),
		ICON_ARCHIVE,
	);

	const recTabs = recommend.createDiv({ cls: "sf-recommend-tabs" });
	for (const tab of ["novel", "chapter", "dossier"] as const) {
		recTabs.createSpan({
			cls: `sf-recommend-tab${activeTab === tab ? " is-active" : ""}`,
			text: tab.charAt(0).toUpperCase() + tab.slice(1),
		});
	}
	return recommend;
}

function hitCard(parent: HTMLElement, span: string, lens: string): void {
	const hit = parent.createDiv({ cls: "sf-recommend-hit sf-recommend-hit-solid" });
	const hitMeta = hit.createDiv({ cls: "sf-recommend-hit-meta" });
	hitMeta.createSpan({ cls: "sf-recommend-tier sf-recommend-tier-solid", text: "solid" });
	hitMeta.createSpan({ cls: "sf-recommend-lens", text: lens });
	hit.createDiv({ cls: "sf-recommend-hit-span", text: span });
	hit.createDiv({ cls: "sf-recommend-codex-fact is-missing", text: "Codex · (no matching fact yet)" });
	const hitActions = hit.createDiv({ cls: "sf-recommend-hit-actions" });
	setIcon(hitActions.createSpan({ cls: "sf-recommend-icon-btn", attr: { "aria-label": "done" } }), ICON_CHECK_SQUARE);
}

function metaRow(meta: HTMLElement, label: string, value: string, iconId: string): void {
	const row = meta.createDiv({ cls: "sf-recommend-meta-row" });
	row.createSpan({ cls: "sf-recommend-meta-label", text: label });
	const control = row.createSpan({ cls: "sf-recommend-meta-control" });
	setIcon(control.createSpan({ cls: "sf-recommend-meta-icon" }), iconId);
	control.createSpan({ cls: "sf-recommend-meta-value", text: value });
}

/** Panel chrome preview — Forge companion rail plus the Story Context header and tabs. */
function mountChromePreview(rail: HTMLElement): void {
	mountForgePreview(rail);
	const recommend = mountRecommendChrome(rail, "chapter");
	const body = recommend.createDiv({ cls: "sf-recommend-body" });
	body.createDiv({
		cls: "sf-empty",
		text: "Panel contents are styled in the Novel, Chapter and Dossier tabs.",
	});
}

/** Novel-mode Story Context — mirrors RecommendationView.renderNovel. */
function mountNovelPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "novel");
	const body = recommend.createDiv({ cls: "sf-recommend-body" });
	const fixed = body.createDiv({ cls: "sf-recommend-fixed sf-recommend-novel-fixed" });

	fixed.createDiv({ cls: "sf-synopsis-cover sf-recommend-novel-cover" });
	fixed.createDiv({ cls: "sf-recommend-novel-title", text: "Ipsum Liber" });
	fixed.createDiv({ cls: "sf-recommend-novel-subtitle", text: "Vol. I — Dolor Sit" });
	fixed.createEl("textarea", {
		cls: "sf-recommend-synopsis sf-recommend-novel-synopsis",
		text: "A courier carries a sealed name across three kingdoms.",
		attr: { readonly: "true", rows: "3" },
	});

	const defaultPov = fixed.createDiv({ cls: "sf-recommend-section" });
	metaRow(defaultPov.createDiv({ cls: "sf-recommend-meta" }), "Default PoV:", "Mara Venn", ICON_PERSON);

	const plotLine = fixed.createDiv({ cls: "sf-book-line sf-synopsis-plot-title" });
	setIcon(plotLine.createSpan({ cls: "sf-icon" }), ICON_TIMELINE);
	const plotTitleRow = plotLine.createDiv({ cls: "sf-header-line sf-book-title-row" });
	plotTitleRow.createDiv({ cls: "sf-book-text-wrap" }).createSpan({ cls: "sf-header-text", text: "Plot" });

	const scroll = body.createDiv({ cls: "sf-recommend-scroll" });
	for (const [chapter, place] of [
		["I. Amet Consectetur", "The gatehouse"],
		["II. Adipiscing Elit", "The ford"],
	] as const) {
		const block = scroll.createDiv({ cls: "sf-recommend-plot-block" });
		block.createDiv({ cls: "sf-recommend-plot-chapter-name", text: chapter });
		const meta = block.createDiv({ cls: "sf-recommend-meta" });
		metaRow(meta, "PoV:", "Mara Venn", ICON_PERSON);
		metaRow(meta, "Location:", place, ICON_MAP_PIN);
		block.createEl("textarea", {
			cls: "sf-recommend-synopsis sf-recommend-plot-textarea",
			text: "Mara reaches the ford before dawn.",
			attr: { readonly: "true", rows: "2" },
		});
	}
}

/** Dossier-mode Story Context — mirrors RecommendationView.renderDossier. */
function mountDossierPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "dossier");
	const body = recommend.createDiv({ cls: "sf-recommend-body" });

	const fixed = body.createDiv({ cls: "sf-recommend-fixed" });
	const combo = fixed.createDiv({ cls: "sf-recommend-dossier-combo" });
	const input = combo.createEl("input", {
		cls: "sf-recommend-dossier-search",
		attr: { type: "search", readonly: "true", "aria-label": "Search Codex entity" },
	});
	input.value = "Mara Venn";
	setIcon(
		combo.createSpan({
			cls: "sf-recommend-icon-btn sf-recommend-dossier-drop",
			attr: { "aria-label": "Clear Codex entity" },
		}),
		ICON_MULTIPLY_SQUARE,
	);

	const scroll = body.createDiv({ cls: "sf-recommend-scroll" });
	for (const [chapter, span] of [
		["I. Amet Consectetur", "She kept the seal under her coat."],
		["II. Adipiscing Elit", "Her cloak was still wet from the crossing."],
	] as const) {
		const section = scroll.createDiv({ cls: "sf-recommend-section" });
		section.createDiv({ cls: "sf-recommend-section-title", text: chapter });
		hitCard(section, span, "appearance");
	}
}

/** Chapter-mode Story Context chrome — mirrors RecommendationView.renderChapter. */
function mountChapterPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "chapter");
	const body = recommend.createDiv({ cls: "sf-recommend-body" });
	const fixed = body.createDiv({ cls: "sf-recommend-fixed" });

	const titleRow = fixed.createDiv({ cls: "sf-recommend-chapter-title-row" });
	titleRow.createDiv({ cls: "sf-recommend-chapter-title", text: "III. The Crossing" });
	setIcon(titleRow.createSpan({ cls: "sf-recommend-refresh", attr: { "aria-label": "Refresh" } }), "refresh-cw");

	const synSection = fixed.createDiv({ cls: "sf-recommend-section" });
	synSection.createDiv({ cls: "sf-recommend-section-title", text: "Chapter summary" });
	synSection.createEl("textarea", {
		cls: "sf-recommend-synopsis",
		text: "Mara reaches the ford before dawn.",
		attr: { readonly: "true", rows: "2" },
	});
	const synActions = synSection.createDiv({ cls: "sf-recommend-synopsis-actions" });
	setIcon(synActions.createSpan({ cls: "sf-recommend-icon-btn", attr: { "aria-label": "view chapter" } }), ICON_EYE);
	setIcon(synActions.createSpan({ cls: "sf-recommend-icon-btn", attr: { "aria-label": "add to chapter" } }), ICON_FILE_PLUS);

	const meta = fixed.createDiv({ cls: "sf-recommend-meta" });
	metaRow(meta, "PoV:", "Mara Venn", ICON_PERSON);
	metaRow(meta, "Location:", "The ford", ICON_MAP_PIN);

	const charsSection = fixed.createDiv({ cls: "sf-recommend-section" });
	charsSection.createDiv({ cls: "sf-recommend-section-title", text: "Characters in chapter" });
	recommendRow(charsSection, "Mara Venn", ICON_PERSON);
	recommendRow(charsSection, "Tollen", ICON_PERSON);

	const scroll = body.createDiv({ cls: "sf-recommend-scroll" });

	const otherSection = scroll.createDiv({ cls: "sf-recommend-section" });
	otherSection.createDiv({ cls: "sf-recommend-section-title", text: "Other Codex references" });
	recommendRow(otherSection, "The ford", ICON_MAP_PIN);

	const unknownSection = scroll.createDiv({ cls: "sf-recommend-section" });
	unknownSection.createDiv({ cls: "sf-recommend-section-title", text: "Named but not in Codex" });
	const unknownRow = recommendRow(unknownSection, "Ashen Rider");
	const unknownActions = unknownRow.createDiv({ cls: "sf-recommend-row-actions" });
	setIcon(unknownActions.createSpan({ cls: "sf-recommend-icon-btn", attr: { "aria-label": "create in codex" } }), ICON_PLUS_SQUARE);
	setIcon(unknownActions.createSpan({ cls: "sf-recommend-icon-btn", attr: { "aria-label": "ignore" } }), ICON_MINUS_SQUARE);

	const detailsSection = scroll.createDiv({ cls: "sf-recommend-section" });
	detailsSection.createDiv({ cls: "sf-recommend-section-title", text: "Details to capture" });
	const entityHeader = detailsSection.createDiv({ cls: "sf-recommend-entity-header" });
	entityHeader.createSpan({ cls: "sf-recommend-entity-name", text: "Mara Venn" });
	hitCard(detailsSection, "Her cloak was still wet from the crossing.", "appearance");
}

function mountArchivePreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, null);
	const body = recommend.createDiv({ cls: "sf-recommend-body" });
	const archive = body.createDiv({ cls: "sf-archive-embedded" });

	const fixed = archive.createDiv({ cls: "sf-recommend-fixed" });
	const archiveHeader = fixed.createDiv({ cls: "sf-archive-embedded-header" });
	setIcon(archiveHeader.createSpan({ cls: "sf-icon" }), ICON_ARCHIVE);
	archiveHeader.createSpan({ cls: "sf-archive-view-title", text: "Archive" });
	const archTabs = fixed.createDiv({ cls: "sf-archive-view-tabs sf-archive-embedded-tabs" });
	archTabs.createSpan({ cls: "sf-archive-view-tab is-active", text: "Codex" });
	archTabs.createSpan({ cls: "sf-archive-view-tab", text: "Novel" });

	const archList = archive.createDiv({ cls: "sf-recommend-scroll" }).createDiv({ cls: "sf-archive-list" });
	listRow(archList, "Old Draft — Book I", true);
	listRow(archList, "Cut scenes");
	listRow(archList, "Research scrap");
}

/** Mounts right-rail chrome for the active right-sidebar sub-tab. */
export function mountRightSidebarPreviewSample(
	container: HTMLElement,
	mode: RightSidebarPreviewMode = "chrome",
): void {
	container.empty();
	const rail = container.createDiv({ cls: "sf-right-rail-preview" });
	if (mode === "chrome") mountChromePreview(rail);
	else if (mode === "novel") mountNovelPreview(rail);
	else if (mode === "chapter") mountChapterPreview(rail);
	else if (mode === "dossier") mountDossierPreview(rail);
	else mountArchivePreview(rail);
}
