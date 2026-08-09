/**
 * Bridge to storyForge's formatting host API (v2 baseline; v8 current).
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

export interface SfFontInfo {
	id: string;
	label: string;
	weightMin: number;
	weightMax: number;
}

export interface SfOpenFontPickerOptions {
	currentFamilyId: string;
	previewFontSizeEm: number;
	onPick: (familyId: string) => void;
	/** Present when storyForge's field has an "override vs theme default" concept — mirrors
	 * FontPickerModal's own `themeDefault` option: appends a "Theme default" row, selected when
	 * `isThemeDefault` is true, calling `onPickThemeDefault` instead of `onPick` when chosen. */
	isThemeDefault?: boolean;
	onPickThemeDefault?: () => void;
}

export interface SfFormatCompanionRegistration {
	pluginId: string;
	version: number;
	openSettings?: () => void;
	onHostStylesApplied?: () => void;
	resolveFont?: (familyId: string, weight: number) => SfFontResolveResult | null;
	registerFacesForDocument?: (doc: Document) => void;
	/** List formatForge's font catalog — mirrors the same method already exposed to timelineForge. */
	listFonts?: () => SfFontInfo[];
	/** Open formatForge's own font-picker modal, scoped to one storyForge field. */
	openFontPicker?: (opts: SfOpenFontPickerOptions) => void;
}

// ── Linked key contract (generated from storyForge host) ──────────────────

export {
	LINKED_FORMATTING_KEYS,
	STORYFORGE_FORMATTING_CONTRACT_VERSION,
} from "./storyforgeLinkedFormattingKeys.generated";
export type { SfLinkedFormattingKey } from "./storyforgeLinkedFormattingKeys.generated";
import type { SfLinkedFormattingKey } from "./storyforgeLinkedFormattingKeys.generated";

// ── Formatting API surface ─────────────────────────────────────────────────

export interface SfFormattingApi {
	version: number;
	isCompanionActive(): boolean;
	registerCompanion(reg: SfFormatCompanionRegistration): () => void;
	getLinkedSettings(): Record<SfLinkedFormattingKey, unknown>;
	getLinkedSetting(key: SfLinkedFormattingKey): unknown;
	updateLinkedSetting(key: SfLinkedFormattingKey, value: unknown): Promise<void>;
	/** Available from storyForge API v8; validates and persists the patch once. */
	updateLinkedSettings?(
		partial: Partial<Record<SfLinkedFormattingKey, unknown>>,
	): Promise<void>;
	applyLinkedStyles(): void;
	setStyleVars(vars: Record<string, string | null>): void;
	getStyleDocuments(): Document[];
	getPalette(): { name: SfPaletteName; variant: string; customColors: SfPaletteColor[] };
	updatePalette(partial: {
		name?: SfPaletteName;
		variant?: string;
		customColors?: SfPaletteColor[];
	}): Promise<void>;
	/** Available from storyForge API v4; saves JSON under `_sf-backup/`. */
	saveFormattingExport?(content: string): Promise<string>;
	/** Available from storyForge API v5; discovers/reads settings exports in `_sf-backup/`. */
	listSettingsExports?(): Promise<Array<{ path: string; name: string }>>;
	readSettingsExport?(path: string): Promise<string>;
	/** Available from storyForge API v6; user-named presets in backstage. */
	saveFormattingPreset?(name: string, content: string, overwrite?: boolean): Promise<{ path: string; name: string }>;
	listFormattingPresets?(): Promise<Array<{ path: string; name: string }>>;
	readFormattingPreset?(path: string): Promise<string>;
	/** Available from storyForge API v7; managed preset operations. */
	renameFormattingPreset?(path: string, newName: string, overwrite?: boolean): Promise<{ path: string; name: string }>;
	deleteFormattingPreset?(path: string): Promise<void>;
	/** Available from storyForge API v3; the registration record of the live companion. */
	getCompanion?(): SfFormatCompanionRegistration | null;
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

/** Members every supported host must provide; a partial API is treated as no host at all. */
const REQUIRED_MEMBERS = [
	"isCompanionActive",
	"registerCompanion",
	"getLinkedSettings",
	"getLinkedSetting",
	"updateLinkedSetting",
	"applyLinkedStyles",
	"setStyleVars",
	"getStyleDocuments",
	"getPalette",
	"updatePalette",
	"registerViewContribution",
] as const satisfies readonly (keyof SfFormattingApi)[];

/**
 * Returns the SF formatting API if storyForge is loaded, at version >= 2, and actually
 * exposes the baseline surface. The shape check matters more than the version number: a
 * host that reports a high version but is missing a method would otherwise blow up at
 * the first style write instead of falling back to standalone behaviour.
 */
export function getSfFormattingApi(app: App): SfFormattingApi | null {
	const anyApp = app as unknown as {
		plugins: { getPlugin(id: string): { api?: StoryForgeHostApi } | null | undefined };
	};
	const sf = anyApp.plugins.getPlugin("storyforge");
	if (!sf?.api || sf.api.version < 2 || !sf.api.formatting) return null;
	const formatting = sf.api.formatting as unknown as Record<string, unknown>;
	for (const member of REQUIRED_MEMBERS) {
		if (typeof formatting[member] !== "function") return null;
	}
	return sf.api.formatting;
}

// ── Capability probes ──────────────────────────────────────────────────────
//
// Feature-detect functions rather than comparing version numbers: a host may ship a
// capability early, and a version check would also pass on a host that reports the
// version but omits the method.

/** Batched, single-save linked updates (storyForge v8). */
export function hostSupportsBatchUpdates(api: SfFormattingApi | null): api is SfFormattingApi {
	return typeof api?.updateLinkedSettings === "function";
}

/** Dated settings exports under `_sf-backup/`. */
export function hostSupportsBackupExports(api: SfFormattingApi | null): api is SfFormattingApi {
	return (
		typeof api?.saveFormattingExport === "function" &&
		typeof api?.listSettingsExports === "function" &&
		typeof api?.readSettingsExport === "function"
	);
}

/** User-named theme presets. */
export function hostSupportsThemeLibrary(api: SfFormattingApi | null): api is SfFormattingApi {
	return (
		typeof api?.saveFormattingPreset === "function" &&
		typeof api?.listFormattingPresets === "function" &&
		typeof api?.readFormattingPreset === "function"
	);
}

/** Named presets plus rename and delete. */
export function hostSupportsPresetManagement(api: SfFormattingApi | null): api is SfFormattingApi {
	return (
		hostSupportsThemeLibrary(api) &&
		typeof api.renameFormattingPreset === "function" &&
		typeof api.deleteFormattingPreset === "function"
	);
}
