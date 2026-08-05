/**
 * Value contract for formatForge's own settings.
 *
 * storyForge validates every linked key it accepts; formatForge previously trusted
 * whatever `data.json` or an imported theme contained, so a hand-edited file could
 * store a bad enum and produce CSS like `undefinedpx solid …`. Anything failing its
 * predicate here is dropped in favour of the current (or default) value.
 */

import {
	DEFAULT_SETTINGS,
	type FormatForgeSettings,
	type HeadingDividerThickness,
	type EditorScrollbarThickness,
	type FontWeight,
} from "./settings";
import { PALETTE_NAMES, type PaletteColor } from "./colorPalettes";

const HEADING_DIVIDER_THICKNESSES: readonly HeadingDividerThickness[] = [
	"thin",
	"medium",
	"thick",
	"extra-thick",
];
const EDITOR_SCROLLBAR_THICKNESSES: readonly EditorScrollbarThickness[] = ["thin", "medium", "thick"];
const FONT_WEIGHTS: readonly FontWeight[] = ["300", "400", "500", "600", "700", "800", "900"];

type Predicate = (value: unknown) => boolean;

const isBoolean: Predicate = (value) => typeof value === "boolean";
const isNonEmptyString: Predicate = (value) => typeof value === "string" && value.length > 0;
const isString: Predicate = (value) => typeof value === "string";
/** Sizes are `em` multipliers; a non-finite or absurd value would break the editor. */
const isSize: Predicate = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 10;

function isOneOf(allowed: readonly string[]): Predicate {
	const set = new Set(allowed);
	return (value) => typeof value === "string" && set.has(value);
}

function isPaletteColorArray(value: unknown): boolean {
	if (!Array.isArray(value)) return false;
	return value.every(
		(entry) =>
			entry !== null &&
			typeof entry === "object" &&
			typeof (entry as PaletteColor).name === "string" &&
			typeof (entry as PaletteColor).hex === "string",
	);
}

const isDividerThickness = isOneOf(HEADING_DIVIDER_THICKNESSES);
const isFontWeight = isOneOf(FONT_WEIGHTS);

/** Per-heading keys repeat identically for H1–H6, so build them rather than listing 72 entries. */
function headingValidators(): Record<string, Predicate> {
	const out: Record<string, Predicate> = {};
	for (const n of [1, 2, 3, 4, 5, 6] as const) {
		out[`heading${n}OverrideSize`] = isBoolean;
		out[`heading${n}Size`] = isSize;
		out[`heading${n}OverrideColor`] = isBoolean;
		out[`heading${n}Color`] = isNonEmptyString;
		out[`heading${n}OverrideFont`] = isBoolean;
		out[`heading${n}FontFamily`] = isString;
		out[`heading${n}FontWeight`] = isFontWeight;
		out[`heading${n}SmallCaps`] = isBoolean;
		out[`heading${n}DividerAbove`] = isBoolean;
		out[`heading${n}DividerAboveThickness`] = isDividerThickness;
		out[`heading${n}DividerBelow`] = isBoolean;
		out[`heading${n}DividerBelowThickness`] = isDividerThickness;
	}
	return out;
}

export const SETTING_VALIDATORS: Record<keyof FormatForgeSettings, Predicate> = {
	colorPaletteName: isOneOf(PALETTE_NAMES),
	colorPaletteVariant: isString,
	customPaletteColors: isPaletteColorArray,

	editorScrollbarThumbColor: isNonEmptyString,
	editorScrollbarThickness: isOneOf(EDITOR_SCROLLBAR_THICKNESSES),

	bodyTextOverrideSize: isBoolean,
	bodyTextSize: isSize,
	bodyTextOverrideColor: isBoolean,
	bodyTextColor: isNonEmptyString,
	bodyTextOverrideFont: isBoolean,
	bodyTextFontFamily: isString,
	bodyTextFontWeight: isFontWeight,
	bodyTextOverrideEmphasisColor: isBoolean,
	bodyTextBoldColor: isNonEmptyString,
	bodyTextItalicColor: isNonEmptyString,
	bodyLinkOverrideColor: isBoolean,
	bodyLinkColor: isNonEmptyString,
	bodyLinkHoverColor: isNonEmptyString,
	bodyLinkRemoveUnderline: isBoolean,
	bodyHighlightOverride: isBoolean,
	bodyHighlightBgColor: isNonEmptyString,
	bodyHighlightTextColor: isNonEmptyString,

	hideHeading1Links: isBoolean,

	...headingValidators(),
} as Record<keyof FormatForgeSettings, Predicate>;

export function isValidSettingValue(key: string, value: unknown): boolean {
	const validator = SETTING_VALIDATORS[key as keyof FormatForgeSettings];
	return validator ? validator(value) : false;
}

/**
 * Copies the known keys of `incoming` onto `base`, skipping any value that fails its
 * predicate. Returns the merged settings plus the keys that were rejected so callers
 * can tell the user rather than silently discarding their file.
 */
export function coerceSettings(
	base: FormatForgeSettings,
	incoming: Record<string, unknown>,
): { settings: FormatForgeSettings; rejected: string[] } {
	const merged = { ...base } as unknown as Record<string, unknown>;
	const rejected: string[] = [];
	for (const key of Object.keys(DEFAULT_SETTINGS)) {
		if (!Object.prototype.hasOwnProperty.call(incoming, key)) continue;
		const value = incoming[key];
		if (isValidSettingValue(key, value)) merged[key] = value;
		else rejected.push(key);
	}
	const settings = merged as unknown as FormatForgeSettings;
	settings.customPaletteColors = settings.customPaletteColors.map((color) => ({ ...color }));
	return { settings, rejected };
}
