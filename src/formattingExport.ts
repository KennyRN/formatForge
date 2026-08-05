import type { FormatForgeSettings } from "./settings";
import type { SfLinkedFormattingKey } from "./storyforgeBridge";

export const FORMATTING_EXPORT_FORMAT = "formatForge-settings" as const;
export const FORMATTING_EXPORT_VERSION = 2 as const;

export const PALETTE_KEYS = [
	"colorPaletteName",
	"colorPaletteVariant",
	"customPaletteColors",
] as const;

export const SF_TEXT_STYLING_KEYS: SfLinkedFormattingKey[] = [
	"bodyTextOverrideSize",
	"bodyTextSize",
	"heading1OverrideSize",
	"heading1Size",
	"heading2OverrideSize",
	"heading2Size",
	"heading3OverrideSize",
	"heading3Size",
	"heading4OverrideSize",
	"heading4Size",
	"heading5OverrideSize",
	"heading5Size",
	"heading6OverrideSize",
	"heading6Size",
	"cyclingGuideEnabled",
	"cyclingGuideThickness",
	"cyclingGuideColor",
	"cyclingGuideFlagSize",
	"cyclingGuideRoundedLines",
	"cyclingGuideInterval",
	"editorScrollbarThumbColor",
	"editorScrollbarThickness",
];

export interface FormattingExportSelection {
	textStyling: boolean;
	storyForgeInterface: boolean;
	palette: boolean;
}

export interface FormattingPalette {
	colorPaletteName: unknown;
	colorPaletteVariant: unknown;
	customPaletteColors: unknown;
}

export interface FormattingExportDocument {
	format: typeof FORMATTING_EXPORT_FORMAT;
	version: typeof FORMATTING_EXPORT_VERSION;
	exportedAt: string;
	description?: string;
	included: FormattingExportSelection;
	textStyling: Record<string, unknown> | null;
	storyForgeInterface: Record<string, unknown> | null;
	palette: FormattingPalette | null;
}

function withoutKeys(
	source: Record<string, unknown>,
	excluded: ReadonlySet<string>,
): Record<string, unknown> {
	return Object.fromEntries(Object.entries(source).filter(([key]) => !excluded.has(key)));
}

function pickKeys(
	source: Record<string, unknown>,
	keys: readonly string[],
): Record<string, unknown> {
	return Object.fromEntries(
		keys
			.filter((key) => Object.prototype.hasOwnProperty.call(source, key))
			.map((key) => [key, source[key]]),
	);
}

/** Builds a portable, optionally-partial formatting document. */
export function buildFormattingExport(
	textStyling: FormatForgeSettings,
	storyForgeInterface: Record<SfLinkedFormattingKey, unknown> | null,
	exportedAt: Date = new Date(),
	options: {
		description?: string;
		included?: Partial<FormattingExportSelection>;
	} = {},
): FormattingExportDocument {
	const included: FormattingExportSelection = {
		textStyling: options.included?.textStyling ?? true,
		storyForgeInterface:
			(options.included?.storyForgeInterface ?? storyForgeInterface !== null) &&
			storyForgeInterface !== null,
		palette: options.included?.palette ?? true,
	};
	const local = textStyling as unknown as Record<string, unknown>;
	const linked = storyForgeInterface as Record<string, unknown> | null;
	const paletteExcluded = new Set<string>(PALETTE_KEYS);
	const interfaceExcluded = new Set<string>([
		...PALETTE_KEYS,
		...SF_TEXT_STYLING_KEYS,
	]);
	const textSection = withoutKeys(local, paletteExcluded);
	if (linked) Object.assign(textSection, pickKeys(linked, SF_TEXT_STYLING_KEYS));
	const description = options.description?.trim();

	return {
		format: FORMATTING_EXPORT_FORMAT,
		version: FORMATTING_EXPORT_VERSION,
		exportedAt: exportedAt.toISOString(),
		...(description ? { description } : {}),
		included,
		textStyling: included.textStyling ? textSection : null,
		storyForgeInterface:
			included.storyForgeInterface && linked
				? withoutKeys(linked, interfaceExcluded)
				: null,
		palette: included.palette
			? {
					colorPaletteName: linked?.colorPaletteName ?? local.colorPaletteName,
					colorPaletteVariant: linked?.colorPaletteVariant ?? local.colorPaletteVariant,
					customPaletteColors: linked?.customPaletteColors ?? local.customPaletteColors,
				}
			: null,
	};
}

export function stringifyFormattingExport(document: FormattingExportDocument): string {
	return JSON.stringify(document, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSelection(value: unknown): value is FormattingExportSelection {
	return (
		isRecord(value) &&
		typeof value.textStyling === "boolean" &&
		typeof value.storyForgeInterface === "boolean" &&
		typeof value.palette === "boolean"
	);
}

function isPalette(value: unknown): value is FormattingPalette {
	if (!isRecord(value)) return false;
	if (
		typeof value.colorPaletteName !== "string" ||
		typeof value.colorPaletteVariant !== "string" ||
		!Array.isArray(value.customPaletteColors)
	) {
		return false;
	}
	return value.customPaletteColors.every(
		(color) =>
			isRecord(color) &&
			typeof color.name === "string" &&
			typeof color.hex === "string",
	);
}

function migrateVersionOne(parsed: Record<string, unknown>): FormattingExportDocument {
	if (!isRecord(parsed.textStyling)) {
		throw new Error("The export is missing its Text styling settings");
	}
	if (parsed.storyForgeInterface !== null && !isRecord(parsed.storyForgeInterface)) {
		throw new Error("The storyForge interface settings are invalid");
	}
	const local = parsed.textStyling;
	const linked = parsed.storyForgeInterface as Record<string, unknown> | null;
	const textSection = withoutKeys(local, new Set<string>(PALETTE_KEYS));
	if (linked) Object.assign(textSection, pickKeys(linked, SF_TEXT_STYLING_KEYS));
	return {
		format: FORMATTING_EXPORT_FORMAT,
		version: FORMATTING_EXPORT_VERSION,
		exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date(0).toISOString(),
		included: {
			textStyling: true,
			storyForgeInterface: linked !== null,
			palette: true,
		},
		textStyling: textSection,
		storyForgeInterface: linked
			? withoutKeys(linked, new Set<string>([...PALETTE_KEYS, ...SF_TEXT_STYLING_KEYS]))
			: null,
		palette: {
			colorPaletteName: linked?.colorPaletteName ?? local.colorPaletteName,
			colorPaletteVariant: linked?.colorPaletteVariant ?? local.colorPaletteVariant,
			customPaletteColors: linked?.customPaletteColors ?? local.customPaletteColors,
		},
	};
}

/** Parses version 2 and migrates the original version 1 documents. */
export function parseFormattingExport(text: string): FormattingExportDocument {
	const parsed: unknown = JSON.parse(text);
	if (!isRecord(parsed)) throw new Error("Formatting import must be a JSON object");
	if (parsed.format !== FORMATTING_EXPORT_FORMAT) {
		throw new Error("This is not a formatForge formatting export");
	}
	if (parsed.version === 1) return migrateVersionOne(parsed);
	if (parsed.version !== FORMATTING_EXPORT_VERSION) {
		throw new Error(`Unsupported formatForge export version: ${String(parsed.version)}`);
	}
	if (
		typeof parsed.exportedAt !== "string" ||
		!Number.isFinite(Date.parse(parsed.exportedAt))
	) {
		throw new Error("The export timestamp is invalid");
	}
	if (parsed.description !== undefined && typeof parsed.description !== "string") {
		throw new Error("The export description is invalid");
	}
	if (!isSelection(parsed.included)) {
		throw new Error("The export is missing its included-sections metadata");
	}
	if (parsed.textStyling !== null && !isRecord(parsed.textStyling)) {
		throw new Error("The Text styling settings are invalid");
	}
	if (parsed.storyForgeInterface !== null && !isRecord(parsed.storyForgeInterface)) {
		throw new Error("The storyForge interface settings are invalid");
	}
	if (parsed.palette !== null && !isPalette(parsed.palette)) {
		throw new Error("The palette settings are invalid");
	}
	if (
		parsed.included.textStyling !== (parsed.textStyling !== null) ||
		parsed.included.storyForgeInterface !== (parsed.storyForgeInterface !== null) ||
		parsed.included.palette !== (parsed.palette !== null)
	) {
		throw new Error("The included-sections metadata does not match the export contents");
	}
	const paletteExcluded = new Set<string>(PALETTE_KEYS);
	const interfaceExcluded = new Set<string>([
		...PALETTE_KEYS,
		...SF_TEXT_STYLING_KEYS,
	]);
	return {
		format: FORMATTING_EXPORT_FORMAT,
		version: FORMATTING_EXPORT_VERSION,
		exportedAt: parsed.exportedAt,
		...(typeof parsed.description === "string" ? { description: parsed.description } : {}),
		included: parsed.included,
		// Hand-edited docs may still bury palette/size keys; strip them so apply cannot bleed.
		textStyling: parsed.textStyling
			? withoutKeys(parsed.textStyling, paletteExcluded)
			: null,
		storyForgeInterface: parsed.storyForgeInterface
			? withoutKeys(parsed.storyForgeInterface, interfaceExcluded)
			: null,
		palette: parsed.palette,
	};
}
