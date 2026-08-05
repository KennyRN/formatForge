/**
 * Bridge to storyForge's host API (version 2+).
 *
 * All types here are local copies / subsets of storyForge's API surface so
 * formatForge has no compile-time source dependency on the storyForge package.
 * At runtime the API is accessed via `app.plugins.getPlugin("storyforge")?.api`.
 */

import type { App } from "obsidian";

// ── Palette ────────────────────────────────────────────────────────────────

export interface SfPaletteColor {
	name: string;
	hex: string;
}

export type SfPaletteName = string;

// ── Companion registration ─────────────────────────────────────────────────

export interface SfFontResolveResult {
	family: string;
	variation: string | null;
}

export interface SfFormatCompanionRegistration {
	pluginId: string;
	version: number;
	openSettings?: () => void;
	onHostStylesApplied?: () => void;
	resolveFont?: (familyId: string, weight: number) => SfFontResolveResult | null;
	registerFacesForDocument?: (doc: Document) => void;
}

// ── Linked key type (mirrors formattingApi.ts) ─────────────────────────────

export type SfLinkedFormattingKey =
	| "colorPaletteName"
	| "colorPaletteVariant"
	| "customPaletteColors"
	| "highlightActiveChapter"
	| "highlightColor"
	| "highlightTextColor"
	| "librarySeriesTitleFontSize"
	| "librarySeriesTitleOverrideFont"
	| "librarySeriesTitleFontFamily"
	| "librarySeriesTitleFontWeight"
	| "librarySeriesTitleColor"
	| "librarySeriesTitleSmallCaps"
	| "libraryBookTitleFontSize"
	| "libraryBookTitleOverrideFont"
	| "libraryBookTitleFontFamily"
	| "libraryBookTitleFontWeight"
	| "libraryBookTitleColor"
	| "libraryBookTitleSmallCaps"
	| "libraryBookSubtitleFontSize"
	| "libraryBookSubtitleOverrideFont"
	| "libraryBookSubtitleFontFamily"
	| "libraryBookSubtitleFontWeight"
	| "libraryBookSubtitleSmallCaps"
	| "libraryHeaderDividerBelow"
	| "libraryItemsFontSize"
	| "libraryItemsOverrideFont"
	| "libraryItemsFontFamily"
	| "libraryItemsFontWeight"
	| "libraryItemsColor"
	| "libraryItemsMuted"
	| "unplacedHighlightColor"
	| "unplacedHighlightTextColor"
	| "codexHighlightColor"
	| "codexHighlightTextColor"
	| "unplacedMuted"
	| "unplacedSmallCaps"
	| "unplacedColor"
	| "unplacedFontSize"
	| "unplacedOverrideFont"
	| "unplacedFontFamily"
	| "unplacedFontWeight"
	| "unplacedItemsFontSize"
	| "unplacedItemsOverrideFont"
	| "unplacedItemsFontFamily"
	| "unplacedItemsFontWeight"
	| "unplacedItemsColor"
	| "unplacedItemsMuted"
	| "unplacedUseHeaderColorForAll"
	| "codexMuted"
	| "codexSmallCaps"
	| "codexColor"
	| "codexFontSize"
	| "codexOverrideFont"
	| "codexFontFamily"
	| "codexFontWeight"
	| "codexFolderFontSize"
	| "codexFolderOverrideFont"
	| "codexFolderFontFamily"
	| "codexFolderFontWeight"
	| "codexFolderColor"
	| "codexFolderIndicatorThickness"
	| "codexNoteLabelFontSize"
	| "codexNoteLabelOverrideFont"
	| "codexNoteLabelFontFamily"
	| "codexNoteLabelFontWeight"
	| "codexNoteLabelColor"
	| "codexNoteLabelUseDefaultColor"
	| "codexNoteLabelUseFolderColor"
	| "codexUseHeaderColorForAll"
	| "hideSeriesPane"
	| "bodyTextOverrideSize"
	| "bodyTextSize"
	| "heading1OverrideSize"
	| "heading1Size"
	| "heading2OverrideSize"
	| "heading2Size"
	| "heading3OverrideSize"
	| "heading3Size"
	| "heading4OverrideSize"
	| "heading4Size"
	| "heading5OverrideSize"
	| "heading5Size"
	| "heading6OverrideSize"
	| "heading6Size"
	| "cyclingGuideEnabled"
	| "cyclingGuideThickness"
	| "cyclingGuideColor"
	| "cyclingGuideFlagSize"
	| "cyclingGuideRoundedLines"
	| "cyclingGuideInterval"
	| "editorScrollbarThumbColor"
	| "editorScrollbarThickness"
	| "forgeCompanionIconColor"
	| "recommendHeaderFontSize"
	| "recommendHeaderOverrideFont"
	| "recommendHeaderFontFamily"
	| "recommendHeaderFontWeight"
	| "recommendHeaderColor"
	| "recommendHeaderMuted"
	| "recommendHeaderSmallCaps"
	| "recommendTabsFontSize"
	| "recommendTabsOverrideFont"
	| "recommendTabsFontFamily"
	| "recommendTabsFontWeight"
	| "recommendTabsColor"
	| "recommendTabsActiveColor"
	| "recommendChapterTitleFontSize"
	| "recommendChapterTitleOverrideFont"
	| "recommendChapterTitleFontFamily"
	| "recommendChapterTitleFontWeight"
	| "recommendChapterTitleColor"
	| "recommendChapterTitleMuted"
	| "recommendChapterTitleSmallCaps"
	| "recommendDossierHeaderFontSize"
	| "recommendDossierHeaderOverrideFont"
	| "recommendDossierHeaderFontFamily"
	| "recommendDossierHeaderFontWeight"
	| "recommendDossierHeaderColor"
	| "recommendDossierHeaderMuted"
	| "recommendDossierHeaderSmallCaps"
	| "recommendNovelTitleFontSize"
	| "recommendNovelTitleOverrideFont"
	| "recommendNovelTitleFontFamily"
	| "recommendNovelTitleFontWeight"
	| "recommendNovelTitleColor"
	| "recommendNovelTitleMuted"
	| "recommendNovelTitleSmallCaps"
	| "recommendNovelSubtitleFontSize"
	| "recommendNovelSubtitleOverrideFont"
	| "recommendNovelSubtitleFontFamily"
	| "recommendNovelSubtitleFontWeight"
	| "recommendNovelSubtitleColor"
	| "recommendNovelSubtitleMuted"
	| "recommendNovelSubtitleSmallCaps"
	| "recommendPlotChapterFontSize"
	| "recommendPlotChapterOverrideFont"
	| "recommendPlotChapterFontFamily"
	| "recommendPlotChapterFontWeight"
	| "recommendPlotChapterColor"
	| "recommendPlotChapterMuted"
	| "recommendPlotChapterSmallCaps"
	| "recommendSectionTitleFontSize"
	| "recommendSectionTitleOverrideFont"
	| "recommendSectionTitleFontFamily"
	| "recommendSectionTitleFontWeight"
	| "recommendSectionTitleColor"
	| "recommendSectionTitleMuted"
	| "recommendSectionTitleSmallCaps"
	| "recommendItemsFontSize"
	| "recommendItemsOverrideFont"
	| "recommendItemsFontFamily"
	| "recommendItemsFontWeight"
	| "recommendItemsColor"
	| "recommendItemsMuted"
	| "recommendDetailsFontSize"
	| "recommendDetailsOverrideFont"
	| "recommendDetailsFontFamily"
	| "recommendDetailsFontWeight"
	| "recommendDetailsColor"
	| "recommendDetailsMuted"
	| "recommendMetaLabelFontSize"
	| "recommendMetaLabelOverrideFont"
	| "recommendMetaLabelFontFamily"
	| "recommendMetaLabelFontWeight"
	| "recommendMetaLabelColor"
	| "recommendMetaLabelMuted"
	| "recommendMetaLabelSmallCaps"
	| "recommendMetaControlFontSize"
	| "recommendMetaControlOverrideFont"
	| "recommendMetaControlFontFamily"
	| "recommendMetaControlFontWeight"
	| "recommendMetaControlColor"
	| "recommendMetaControlMuted"
	| "recommendSynopsisFontSize"
	| "recommendSynopsisOverrideFont"
	| "recommendSynopsisFontFamily"
	| "recommendSynopsisFontWeight"
	| "recommendSynopsisColor"
	| "recommendHighlightColor"
	| "recommendHighlightTextColor"
	| "recommendUseHeaderColorForAll"
	| "archiveHeaderFontSize"
	| "archiveHeaderOverrideFont"
	| "archiveHeaderFontFamily"
	| "archiveHeaderFontWeight"
	| "archiveHeaderColor"
	| "archiveHeaderMuted"
	| "archiveHeaderSmallCaps"
	| "archiveItemsFontSize"
	| "archiveItemsOverrideFont"
	| "archiveItemsFontFamily"
	| "archiveItemsFontWeight"
	| "archiveItemsColor"
	| "archiveItemsMuted"
	| "archiveHighlightColor"
	| "archiveHighlightTextColor"
	| "archiveUseHeaderColorForAll";

// ── Formatting API surface ─────────────────────────────────────────────────

export interface SfFormattingApi {
	version: number;
	isCompanionActive(): boolean;
	registerCompanion(reg: SfFormatCompanionRegistration): () => void;
	getLinkedSettings(): Record<SfLinkedFormattingKey, unknown>;
	getLinkedSetting(key: SfLinkedFormattingKey): unknown;
	updateLinkedSetting(key: SfLinkedFormattingKey, value: unknown): Promise<void>;
	applyLinkedStyles(): void;
	setStyleVars(vars: Record<string, string | null>): void;
	getStyleDocuments(): Document[];
	getPalette(): { name: SfPaletteName; variant: string; customColors: SfPaletteColor[] };
	updatePalette(partial: {
		name?: SfPaletteName;
		variant?: string;
		customColors?: SfPaletteColor[];
	}): Promise<void>;
	registerViewContribution(opt: {
		slot: string;
		orderHint?: number;
		render: (containerEl: HTMLElement) => () => void;
	}): () => void;
}

export interface StoryForgeHostApi {
	version: number;
	formatting: SfFormattingApi;
}

// ── Runtime accessor ───────────────────────────────────────────────────────

/**
 * Returns the SF formatting API if storyForge is loaded and at version >= 2,
 * otherwise null.
 */
export function getSfFormattingApi(app: App): SfFormattingApi | null {
	const anyApp = app as unknown as {
		plugins: { getPlugin(id: string): { api?: StoryForgeHostApi } | null | undefined };
	};
	const sf = anyApp.plugins.getPlugin("storyforge");
	if (!sf?.api || sf.api.version < 2 || !sf.api.formatting) return null;
	return sf.api.formatting;
}
