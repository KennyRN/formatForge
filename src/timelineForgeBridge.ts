/**
 * Bridge to timelineForge's Timeline Formatting API (version 1+).
 *
 * Local type copies — no compile-time dependency on the timelineForge package.
 * At runtime: `app.plugins.getPlugin("timelineforge")?.api`.
 */

import type { App } from "obsidian";

export const TIMELINEFORGE_PLUGIN_ID = "timelineforge";

export interface TfFontInfo {
	id: string;
	label: string;
	weightMin: number;
	weightMax: number;
}

export interface TfFontResolveResult {
	family: string;
	variation: string | null;
}

export interface TfOpenFontPickerOptions {
	currentFamilyId: string;
	previewFontSizeEm: number;
	onPick: (familyId: string) => void;
}

export interface TfFormatCompanionRegistration {
	pluginId: string;
	version: number;
	resolveFont?: (familyId: string, weight: number) => TfFontResolveResult | null;
	registerFacesForDocument?: (doc: Document) => void;
	listFonts?: () => TfFontInfo[];
	openFontPicker?: (opts: TfOpenFontPickerOptions) => void;
	onHostStylesApplied?: () => void;
}

export interface TfFormattingApi {
	version: number;
	isCompanionActive(): boolean;
	registerCompanion(reg: TfFormatCompanionRegistration): () => void;
	getCompanion(): TfFormatCompanionRegistration | null;
	notifyStylesApplied(): void;
}

export interface TimelineForgeHostApi {
	version: number;
	formatting: TfFormattingApi;
}

/**
 * Returns the timelineForge formatting API when loaded at version >= 1.
 */
export function getTfFormattingApi(app: App): TfFormattingApi | null {
	const anyApp = app as unknown as {
		plugins: { getPlugin(id: string): { api?: TimelineForgeHostApi } | null | undefined };
	};
	const tf = anyApp.plugins.getPlugin(TIMELINEFORGE_PLUGIN_ID);
	if (!tf?.api || tf.api.version < 1 || !tf.api.formatting) return null;
	if (typeof tf.api.formatting.registerCompanion !== "function") return null;
	return tf.api.formatting;
}
