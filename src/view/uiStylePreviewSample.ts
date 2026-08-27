/**
 * Miniature storyForge panel mock for the storyForge interface live preview.
 * Uses the same `sf-*` classes / icon ids as the live panel so storyForge's
 * stylesheet + `--sf-*` chrome vars style it for real.
 */
import { setIcon } from "obsidian";

const ICON_UNPLACED = "sf-archive-drawer";
const ICON_PLUS_SQUARE = "sf-plus-square";
const ICON_MINUS_SQUARE = "sf-minus-square";
const ICON_CHECK_SQUARE = "sf-check-square";
const ICON_CODEX = "sf-earth-fill";
const ICON_FILTER_LIST = "sf-filter-list";
const ICON_FOLDER_PLUS = "sf-folder-plus";
const ICON_TRANSPORT_TO_START = "sf-transport-to-start";
const ICON_TRANSPORT_PREVIOUS = "sf-transport-previous";
const ICON_TRANSPORT_NEXT = "sf-transport-next";
const ICON_TRANSPORT_TO_END = "sf-transport-to-end";
const ICON_CONTINUOUS_MODE = "sf-continuous-mode";
const ICON_DASHBOARD_CHART = "sf-dashboard-chart";
const ICON_EXCHANGE = "sf-exchange-b";
const ICON_CALENDAR = "sf-calendar-2";
const ICON_PERSON = "sf-person-fill";
const ICON_MEEPLE = "nameforge-meeple";
const ICON_MAP_PIN = "sf-map-pin";
const ICON_ARCHIVE_FILLED = "sf-archive-filled";
const ICON_FORGE = "sf-hammer-anvil";
const ICON_BOOK_DUOTONE = "sf-book-duotone";
const ICON_BOOK_OPEN_FILLED = "sf-book-open-filled";
const ICON_CLIPBOARD_LIST_DUOTONE = "sf-clipboard-list-duotone";
const ICON_NOTEBOOK_DUOTONE = "sf-notebook-duotone";
const ICON_MULTIPLY_SQUARE = "sf-multiply-square";
const ICON_LOCATION_TARGET_SQUARE = "sf-location-target-square";
const ICON_REFRESH_SQUARE = "sf-refresh-square";
const ICON_ADD_SQUARE = "sf-add-square";

export type RightSidebarPreviewMode = "chrome" | "general" | "novel" | "chapter" | "details" | "dossier" | "archive";

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
	seriesLine.createSpan({ cls: "sf-header-text", text: "Lorem Series" });

	const bookLine = header.createDiv({ cls: "sf-book-line" });
	const titleRow = bookLine.createDiv({ cls: "sf-header-line sf-book-title-row" });
	const textWrap = titleRow.createDiv({ cls: "sf-book-text-wrap" });
	textWrap.createSpan({ cls: "sf-header-text", text: "Ipsum Liber" });
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
	const filterBtn = bottomHeader.createSpan({
		cls: "sf-codex-filter-btn",
		attr: { "aria-label": "Filter by type" },
	});
	setIcon(filterBtn, ICON_FILTER_LIST);
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

/**
 * storyTelling pane mock — same composition as the live panel (series + book header, compact
 * navigator, Codex, Stats). Uses `.storyforge-storytelling-view` so storyForge's item-style vars apply.
 */
export function mountStorytellingPreviewSample(container: HTMLElement): void {
	container.empty();

	const view = container.createDiv({ cls: "storyforge-storytelling-view ff-ui-preview-host" });

	const top = view.createDiv({ cls: "sf-top-panel" });
	const header = top.createDiv({ cls: "sf-top-header" });
	const seriesLine = header.createDiv({ cls: "sf-header-line sf-series-line" });
	seriesLine.createSpan({ cls: "sf-header-text", text: "Lorem Series" });
	const bookLine = header.createDiv({ cls: "sf-book-line" });
	const titleRow = bookLine.createDiv({ cls: "sf-header-line sf-book-title-row" });
	titleRow.createDiv({ cls: "sf-book-text-wrap" }).createSpan({ cls: "sf-header-text", text: "Ipsum Liber" });
	bookLine.createDiv({ cls: "sf-book-subtitle-text", text: "Vol. I — Dolor Sit" });

	const body = top.createDiv({ cls: "sf-top-body" });
	const wrap = body.createDiv({ cls: "sf-navigator" });
	const navBody = wrap.createDiv({ cls: "sf-navigator-body" });
	const leftCol = navBody.createDiv({ cls: "sf-navigator-transport-col" });
	const windowEl = navBody.createDiv({ cls: "sf-top-list sf-navigator-window" });
	const rightCol = navBody.createDiv({ cls: "sf-navigator-transport-col" });
	const tiles: Array<{ title: string; selected?: boolean }> = [
		{ title: "I. Amet Consectetur" },
		{ title: "II. Adipiscing Elit", selected: true },
		{ title: "III. Sed Do Eiusmod" },
	];
	for (const tile of tiles) {
		const row = windowEl.createDiv({ cls: tile.selected ? "sf-row sf-row-selected" : "sf-row" });
		row.createDiv({ cls: "sf-row-text", text: tile.title });
	}
	for (const transport of [
		{ icon: ICON_TRANSPORT_TO_START, label: "first chapter" },
		{ icon: ICON_TRANSPORT_PREVIOUS, label: "previous chapter" },
		{ icon: ICON_TRANSPORT_NEXT, label: "next chapter" },
		{ icon: ICON_TRANSPORT_TO_END, label: "last chapter" },
	]) {
		const btn = leftCol.createSpan({
			cls: "sf-navigator-transport-btn",
			attr: { "aria-label": transport.label },
		});
		setIcon(btn, transport.icon);
	}
	const toggle = rightCol.createSpan({
		cls: "sf-navigator-transport-btn sf-navigator-transport-toggle",
		attr: { "aria-label": "continuous reading mode" },
	});
	setIcon(toggle, ICON_CONTINUOUS_MODE);

	const bottom = view.createDiv({ cls: "sf-bottom-panel" });
	const bottomHeader = bottom.createDiv({ cls: "sf-bottom-header" });
	setIcon(bottomHeader.createSpan({ cls: "sf-icon" }), ICON_CODEX);
	bottomHeader.createSpan({ cls: "sf-header-codex", text: "Codex" });
	setIcon(bottomHeader.createSpan({ cls: "sf-codex-filter-btn", attr: { "aria-label": "Filter by type" } }), ICON_FILTER_LIST);
	setIcon(bottomHeader.createSpan({ cls: "sf-codex-new-file-btn", attr: { "aria-label": "New file" } }), ICON_PLUS_SQUARE);
	setIcon(bottomHeader.createSpan({ cls: "sf-codex-new-folder-btn", attr: { "aria-label": "New folder" } }), ICON_FOLDER_PLUS);
	const tree = bottom.createDiv({ cls: "sf-codex-tree" });
	const folder = tree.createDiv({ cls: "sf-codex-folder" });
	const folderHeader = folder.createDiv({ cls: "sf-codex-folder-header" });
	setIcon(folderHeader.createSpan({ cls: "sf-drag-handle" }), "grip-vertical");
	folderHeader.createSpan({ cls: "sf-codex-chevron" });
	folderHeader.createSpan({ cls: "sf-codex-folder-name sf-styled-heading", text: "Magna Aliqua" });

	const stats = view.createDiv({ cls: "sf-stats-panel" });
	const statsHeader = stats.createDiv({ cls: "sf-stats-header" });
	setIcon(statsHeader.createSpan({ cls: "sf-icon" }), ICON_DASHBOARD_CHART);
	statsHeader.createSpan({ cls: "sf-stats-title", text: "Stats" });
	const line = stats.createDiv({ cls: "sf-stats-line" });
	line.createSpan({ cls: "sf-stats-value", text: "daily wordcount: 312" });
	const actions = line.createDiv({ cls: "sf-stats-actions" });
	setIcon(actions.createSpan({ cls: "sf-icon sf-stats-exchange", attr: { "aria-label": "switch wordcount" } }), ICON_EXCHANGE);
	setIcon(actions.createSpan({ cls: "sf-icon sf-stats-calendar", attr: { "aria-label": "wordcount history" } }), ICON_CALENDAR);
}

type RecommendPreviewTab = "novel" | "chapter" | "details" | "dossier" | "forge" | "archive";

/**
 * Story Context navigation — icon tabs matching RecommendationView, so
 * `--sf-recommend-tabs-color` / `--sf-recommend-tabs-active-color` style the preview live.
 */
function mountRecommendChrome(
	rail: HTMLElement,
	activeTab: RecommendPreviewTab | null,
	showFocusIcon = false,
): HTMLElement {
	const recommend = rail.createDiv({ cls: "sf-recommend-view" });
	const recTabs = recommend.createDiv({ cls: "sf-recommend-tabs" });
	const tabs: Array<{ id: RecommendPreviewTab; icon: string; extraCls?: string }> = [
		{ id: "novel", icon: ICON_BOOK_DUOTONE },
		{ id: "chapter", icon: ICON_BOOK_OPEN_FILLED },
		{ id: "details", icon: ICON_CLIPBOARD_LIST_DUOTONE },
		{ id: "dossier", icon: ICON_NOTEBOOK_DUOTONE },
		{ id: "forge", icon: ICON_FORGE, extraCls: "sf-recommend-tab--forge-family" },
		{ id: "archive", icon: ICON_ARCHIVE_FILLED, extraCls: "sf-recommend-tab--archive" },
	];
	for (const tab of tabs) {
		const el = recTabs.createSpan({
			cls: `sf-recommend-tab${tab.extraCls ? ` ${tab.extraCls}` : ""}${activeTab === tab.id ? " is-active" : ""}`,
			attr: { "aria-label": tab.id },
		});
		setIcon(el, tab.icon);
	}
	if (activeTab === "forge") {
		const row = recommend.createDiv({ cls: "sf-recommend-view__forge-row" });
		const member = row.createSpan({
			cls: "sf-recommend-view__forge-icon is-active",
			attr: { "aria-label": "nameForge" },
		});
		setIcon(member, ICON_MEEPLE);
	}
	if (showFocusIcon) {
		const focusRow = recommend.createDiv({ cls: "sf-recommend-view__forge-row sf-recommend-view__forge-row--focus" });
		const focusIcon = focusRow.createSpan({
			cls: "sf-recommend-view__forge-family",
			attr: { "aria-label": "Focus mode icon" },
		});
		setIcon(focusIcon, ICON_FORGE);
	}
	return recommend;
}

function previewIconBtn(parent: HTMLElement, iconId: string, label: string): void {
	setIcon(parent.createSpan({ cls: "sf-recommend-icon-btn", attr: { "aria-label": label } }), iconId);
}

function hitCard(
	parent: HTMLElement,
	span: string,
	lens: string,
	opts: { tier?: string; resolved?: boolean; competing?: string; actions?: boolean } = {},
): void {
	const tier = opts.tier ?? "solid";
	const hit = parent.createDiv({
		cls: `sf-recommend-hit sf-recommend-hit-${tier}${opts.resolved ? " is-resolved" : ""}`,
	});
	const hitMeta = hit.createDiv({ cls: "sf-recommend-hit-meta" });
	hitMeta.createSpan({ cls: `sf-recommend-tier sf-recommend-tier-${tier}`, text: tier });
	hitMeta.createSpan({ cls: "sf-recommend-lens", text: lens });
	hit.createDiv({ cls: "sf-recommend-hit-span", text: span });
	hit.createDiv({ cls: "sf-recommend-codex-fact is-missing", text: "Codex · (no matching fact yet)" });
	if (opts.competing) {
		hit.createDiv({ cls: "sf-recommend-competing", text: opts.competing });
	}
	if (opts.actions === false || opts.resolved) return;
	const hitActions = hit.createDiv({ cls: "sf-recommend-hit-actions" });
	if (tier === "ambiguous") {
		hitActions.createEl("button", { text: "Julius Caesar" });
		hitActions.createEl("button", { text: "Octavian" });
		return;
	}
	previewIconBtn(hitActions, ICON_CHECK_SQUARE, "detail added/accepted");
	previewIconBtn(hitActions, ICON_MINUS_SQUARE, "ignore this detail");
}

function metaRow(meta: HTMLElement, label: string, value: string, iconId: string): void {
	const row = meta.createDiv({ cls: "sf-recommend-meta-row" });
	row.createSpan({ cls: "sf-recommend-meta-label", text: label });
	const control = row.createSpan({ cls: "sf-recommend-meta-control" });
	setIcon(control.createSpan({ cls: "sf-recommend-meta-icon" }), iconId);
	control.createSpan({ cls: "sf-recommend-meta-value", text: value });
}

/**
 * Sample plot-thread gutter — same geometry as storyForge NovelPanel.ts
 * (computeChapterLineGutterMetrics / buildGutterLineBackground). Preview has no live book, so
 * these sample strands stand in for the main thread plus one extra thread.
 */
const PREVIEW_PLOT_THREADS: Array<{ color: string; text: string }> = [
	{ color: "#f59e0b", text: "#1c1917" },
	{ color: "#2563eb", text: "#f8fafc" },
];
const GUTTER_RADIUS = 5;
const GUTTER_LINE_WIDTH = 2;
const GUTTER_LINE_GAP = 2;
const GUTTER_CARD_GAP = 8;

function previewPlotGutter(lineColors: string[]): {
	pillWidth: number;
	lineOffsets: number[];
	cardShift: number;
	background: Record<string, string>;
} {
	const pitch = GUTTER_LINE_WIDTH + GUTTER_LINE_GAP;
	const bundleWidth = (lineColors.length - 1) * pitch + GUTTER_LINE_WIDTH;
	const lineOffsets = lineColors.map((_, i) => GUTTER_RADIUS + i * pitch);
	return {
		pillWidth: 2 * GUTTER_RADIUS + bundleWidth,
		lineOffsets,
		cardShift: GUTTER_RADIUS + bundleWidth + GUTTER_CARD_GAP,
		background: {
			backgroundImage: lineColors.map((c) => `linear-gradient(${c}, ${c})`).join(", "),
			backgroundSize: lineColors.map(() => "2px 100%").join(", "),
			backgroundPosition: lineOffsets.map((x) => `${x}px 0`).join(", "),
			backgroundRepeat: "no-repeat",
		},
	};
}

function mountPreviewPlotTitle(plotLine: HTMLElement, lineColors: string[], gutter: ReturnType<typeof previewPlotGutter>): void {
	const pillCol = plotLine.createDiv({ cls: "sf-recommend-plot-pill-col" });
	pillCol.setCssStyles({ width: `${gutter.pillWidth}px` });
	pillCol.createDiv({ cls: "sf-recommend-plot-pill" }).setCssStyles({ backgroundColor: lineColors[0] });
	pillCol.createDiv({ cls: "sf-recommend-plot-pill-stub" }).setCssStyles(gutter.background);
	const plotTitleRow = plotLine.createDiv({ cls: "sf-header-line sf-book-title-row" });
	plotTitleRow.createDiv({ cls: "sf-book-text-wrap" }).createSpan({ cls: "sf-header-text", text: "Plot" }).setCssStyles({
		color: lineColors[0],
	});
}

function stylePreviewPlotCard(
	block: HTMLElement,
	headerRow: HTMLElement,
	nameEl: HTMLElement,
	thread: { color: string; text: string },
	gutter: ReturnType<typeof previewPlotGutter>,
	lineIndex: number,
): void {
	headerRow.setCssStyles({ backgroundColor: thread.color, color: thread.text });
	nameEl.setCssStyles({ color: thread.text });
	block.setCssProps({
		"--sf-plot-card-header-bg": thread.color,
		"--sf-plot-card-header-fg": thread.text,
	});
	const lineCenterX = gutter.lineOffsets[lineIndex] + GUTTER_LINE_WIDTH / 2;
	const cardPad = 16;
	const headerMarginLeft = lineCenterX - gutter.cardShift - cardPad;
	block.setCssStyles({
		marginLeft: `${gutter.cardShift}px`,
		boxShadow: `inset 0 0 0 2px ${thread.color}`,
	});
	headerRow.setCssStyles({ marginLeft: `${headerMarginLeft}px` });
	const extraBleed = Math.max(0, -cardPad - headerMarginLeft);
	headerRow.setCssStyles({ paddingLeft: `${cardPad + extraBleed}px` });
}

/** Navigation preview — mirrors the live Story Context tab strip (and Forge-family member row). */
function mountChromePreview(rail: HTMLElement): void {
	mountRecommendChrome(rail, "forge", true);
}

/** Shared Story Context styles — one sample of each control on the General tab. */
function mountGeneralPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, null);
	const body = recommend.createDiv({ cls: "sf-recommend-body sf-recommend-body--scroll" });

	const meta = body.createDiv({ cls: "sf-recommend-section" }).createDiv({ cls: "sf-recommend-meta" });
	metaRow(meta, "Default PoV:", "Julius Caesar", ICON_PERSON);
	metaRow(meta, "PoV:", "Julius Caesar", ICON_PERSON);
	metaRow(meta, "Location:", "Rubicon River", ICON_MAP_PIN);

	body.createEl("textarea", {
		cls: "sf-recommend-synopsis sf-recommend-plot-textarea",
		text: "Julius Caesar leads his army across the Rubicon and marches toward Rome.",
		attr: { readonly: "true", rows: "3", "aria-label": "synopsis" },
	});

	const chars = body.createDiv({ cls: "sf-recommend-section" });
	chars.createDiv({ cls: "sf-recommend-section-title", text: "Characters in chapter" });
	recommendRow(chars, "Julius Caesar", ICON_PERSON);
	recommendRow(chars, "Mark Antony", ICON_PERSON);

	const others = body.createDiv({ cls: "sf-recommend-section" });
	others.createDiv({ cls: "sf-recommend-section-title", text: "Other Codex references" });
	recommendRow(others, "Rubicon River", ICON_MAP_PIN);
}

/** Novel-mode Story Context — mirrors NovelPanel.renderNovelPanel (sidebar). Cover stays blank. */
function mountNovelPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "novel");
	const body = recommend.createDiv({ cls: "sf-recommend-body" });
	const fixed = body.createDiv({ cls: "sf-recommend-fixed sf-recommend-novel-fixed" });

	fixed.createDiv({ cls: "sf-synopsis-cover sf-recommend-novel-cover" });
	fixed.createDiv({ cls: "sf-recommend-novel-title", text: "Ipsum Liber" });
	fixed.createDiv({ cls: "sf-recommend-novel-subtitle", text: "Vol. I — Dolor Sit" });
	fixed.createEl("textarea", {
		cls: "sf-recommend-synopsis sf-recommend-novel-synopsis",
		text: "Julius Caesar leads his army across the Rubicon and marches toward Rome.",
		attr: { readonly: "true", rows: "3" },
	});

	const defaultPov = fixed.createDiv({ cls: "sf-recommend-section" });
	metaRow(defaultPov.createDiv({ cls: "sf-recommend-meta" }), "Default PoV:", "Julius Caesar", ICON_PERSON);

	const lineColors = PREVIEW_PLOT_THREADS.map((t) => t.color);
	const gutter = previewPlotGutter(lineColors);
	const plotLine = fixed.createDiv({ cls: "sf-book-line sf-synopsis-plot-title" });
	mountPreviewPlotTitle(plotLine, lineColors, gutter);

	const scroll = body.createDiv({ cls: "sf-recommend-scroll" });
	scroll.setCssStyles({ ...gutter.background, backgroundAttachment: "local" });
	const chapters = [
		["I. Amet Consectetur", "Rubicon River", "Julius Caesar leads his army across the Rubicon.", 0],
		["II. Adipiscing Elit", "Rome", "Mark Antony awaits Caesar's arrival in Rome.", 1],
	] as const;
	for (const [chapter, place, summary, lineIndex] of chapters) {
		const thread = PREVIEW_PLOT_THREADS[lineIndex];
		const block = scroll.createDiv({ cls: "sf-recommend-plot-block sf-recommend-plot-block--plain" });
		const headerRow = block.createDiv({ cls: "sf-recommend-plot-header-row" });
		const nameEl = headerRow.createDiv({ cls: "sf-recommend-plot-chapter-name", text: chapter });
		stylePreviewPlotCard(block, headerRow, nameEl, thread, gutter, lineIndex);
		const meta = block.createDiv({ cls: "sf-recommend-meta" });
		metaRow(meta, "PoV:", "Julius Caesar", ICON_PERSON);
		metaRow(meta, "Location:", place, ICON_MAP_PIN);
		block.createDiv({ cls: "sf-recommend-plot-textarea-divider" });
		block.createEl("textarea", {
			cls: "sf-recommend-synopsis sf-recommend-plot-textarea",
			text: summary,
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
		attr: { type: "search", readonly: "true", "aria-label": "Search Codex entity", placeholder: "Search Codex entity" },
	});
	input.value = "Julius Caesar";
	setIcon(
		combo.createSpan({
			cls: "sf-recommend-icon-btn sf-recommend-dossier-drop",
			attr: { "aria-label": "Clear Codex entity" },
		}),
		ICON_MULTIPLY_SQUARE,
	);

	const scroll = body.createDiv({ cls: "sf-recommend-scroll" });
	for (const [chapter, span] of [
		["I. Amet Consectetur", "He strapped on his freshly polished armour."],
		["II. Adipiscing Elit", "His cloak was still wet from the crossing."],
	] as const) {
		const section = scroll.createDiv({ cls: "sf-recommend-section" });
		section.createDiv({ cls: "sf-recommend-section-title", text: chapter });
		hitCard(section, span, "appearance", { actions: false });
	}
}

/** Chapter-mode Story Context — mirrors RecommendationView.renderChapter. */
function mountChapterPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "chapter");
	const body = recommend.createDiv({ cls: "sf-recommend-body sf-recommend-body--scroll" });
	body.setCssProps({
		"--sf-plot-card-header-bg": "var(--interactive-accent)",
		"--sf-plot-card-header-fg": "var(--text-on-accent)",
	});

	const card = body.createDiv({
		cls: "sf-recommend-plot-block sf-recommend-plot-block--plain sf-recommend-plot-block--chapter",
	});
	card.setCssStyles({ boxShadow: "inset 0 0 0 2px var(--interactive-accent)" });
	const headerRow = card.createDiv({ cls: "sf-recommend-plot-header-row" });
	headerRow.setCssStyles({ backgroundColor: "var(--interactive-accent)", color: "var(--text-on-accent)" });
	headerRow.createDiv({ cls: "sf-recommend-plot-chapter-name", text: "I. Amet Consectetur" }).setCssStyles({
		color: "var(--text-on-accent)",
	});

	const meta = card.createDiv({ cls: "sf-recommend-meta" });
	metaRow(meta, "PoV:", "Julius Caesar", ICON_PERSON);
	metaRow(meta, "Location:", "The ford", ICON_MAP_PIN);

	card.createEl("textarea", {
		cls: "sf-recommend-synopsis sf-recommend-plot-textarea",
		text: "Julius Caesar leads his army across the Rubicon.",
		attr: { readonly: "true", rows: "2" },
	});

	const charsSection = card.createDiv({ cls: "sf-recommend-section" });
	charsSection.createDiv({ cls: "sf-recommend-section-title", text: "Characters in chapter" });
	recommendRow(charsSection, "Julius Caesar", ICON_PERSON);
	recommendRow(charsSection, "Mark Antony", ICON_PERSON);

	const otherSection = card.createDiv({ cls: "sf-recommend-section" });
	otherSection.createDiv({ cls: "sf-recommend-section-title", text: "Other Codex references" });
	recommendRow(otherSection, "Rubicon River", ICON_MAP_PIN);

	const actions = body.createDiv({ cls: "sf-recommend-chapter-card-actions" });
	previewIconBtn(actions, ICON_LOCATION_TARGET_SQUARE, "go to chapter");
	previewIconBtn(actions, ICON_REFRESH_SQUARE, "refresh story context");
	previewIconBtn(actions, ICON_ADD_SQUARE, "add chapter summary to chapter details");

	const unknown = body.createDiv({
		cls: "sf-recommend-plot-block sf-recommend-plot-block--plain sf-recommend-unknown-card",
	});
	const unknownSection = unknown.createDiv({ cls: "sf-recommend-section" });
	unknownSection.createDiv({ cls: "sf-recommend-section-title", text: "Named but not in Codex" });
	const unknownRow = unknownSection.createDiv({ cls: "sf-recommend-row" });
	unknownRow.createSpan({ cls: "sf-recommend-row-label", text: "Rome" });
	const unknownActions = unknownRow.createDiv({ cls: "sf-recommend-row-actions" });
	previewIconBtn(unknownActions, ICON_PLUS_SQUARE, "add to codex");
	previewIconBtn(unknownActions, ICON_MINUS_SQUARE, "ignore");
}

function previewCaption(rail: HTMLElement, text: string): void {
	rail.createDiv({ cls: "sf-right-rail-preview-caption", text });
}

/** Details + Dossier stacked so one settings tab can preview both panes. */
function mountDetailsDossierPreview(rail: HTMLElement): void {
	rail.addClass("sf-right-rail-preview--stacked");
	previewCaption(rail, "Details");
	mountDetailsPreview(rail);
	previewCaption(rail, "Dossier");
	mountDossierPreview(rail);
}

/** Details-mode Story Context — mirrors RecommendationView.renderDetails. */
function mountDetailsPreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "details");
	const body = recommend.createDiv({ cls: "sf-recommend-body sf-recommend-body--scroll" });
	const scroll = body.createDiv({ cls: "sf-recommend-scroll" });

	const open = scroll.createDiv({ cls: "sf-recommend-section" });
	open.createDiv({ cls: "sf-recommend-section-title", text: "Details to capture" });
	const openEntity = open.createDiv({ cls: "sf-recommend-entity-header" });
	openEntity.createSpan({ cls: "sf-recommend-entity-name", text: "Julius Caesar" });
	hitCard(open, "His cloak was still wet from the crossing.", "appearance");

	const holding = scroll.createDiv({ cls: "sf-recommend-section" });
	holding.createDiv({ cls: "sf-recommend-section-title", text: "Holding area" });
	const holdingEntity = holding.createDiv({ cls: "sf-recommend-entity-header" });
	holdingEntity.createSpan({ cls: "sf-recommend-entity-name", text: "Mark Antony" });
	hitCard(holding, "A figure waited on the far bank.", "identity", {
		tier: "ambiguous",
		competing: "Could be: Mark Antony, Octavian",
	});

	const resolved = scroll.createDiv({ cls: "sf-recommend-section" });
	resolved.createDiv({ cls: "sf-recommend-section-title", text: "Resolved" });
	const resolvedEntity = resolved.createDiv({ cls: "sf-recommend-entity-header" });
	resolvedEntity.createSpan({ cls: "sf-recommend-entity-name", text: "Julius Caesar" });
	hitCard(resolved, "He strapped on his freshly polished armour.", "appearance", { resolved: true });
}

function mountArchivePreview(rail: HTMLElement): void {
	const recommend = mountRecommendChrome(rail, "archive");
	const body = recommend.createDiv({ cls: "sf-recommend-body" });
	const archive = body.createDiv({ cls: "sf-archive-embedded" });

	const fixed = archive.createDiv({ cls: "sf-recommend-fixed" });
	const archiveHeader = fixed.createDiv({ cls: "sf-archive-embedded-header" });
	archiveHeader.createSpan({ cls: "sf-archive-view-title", text: "Archive" });
	const archTabs = fixed.createDiv({ cls: "sf-archive-view-tabs sf-archive-embedded-tabs" });
	archTabs.createSpan({ cls: "sf-archive-view-tab is-active", text: "Codex" });
	archTabs.createSpan({ cls: "sf-archive-view-tab", text: "Novel" });

	const archList = archive.createDiv({ cls: "sf-recommend-scroll" }).createDiv({ cls: "sf-archive-list" });
	listRow(archList, "Old Draft: Roman Republic", true);
	listRow(archList, "Cut scenes: Ides of March warning");
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
	else if (mode === "general") mountGeneralPreview(rail);
	else if (mode === "novel") mountNovelPreview(rail);
	else if (mode === "chapter") mountChapterPreview(rail);
	else if (mode === "details" || mode === "dossier") mountDetailsDossierPreview(rail);
	else mountArchivePreview(rail);
}
