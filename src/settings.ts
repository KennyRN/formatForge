import type { PaletteColor, PaletteName } from "./colorPalettes";

export type HeadingDividerThickness = "thin" | "medium" | "thick" | "extra-thick";
export type EditorScrollbarThickness = "thin" | "medium" | "thick";
export type FontWeight = "300" | "400" | "500" | "600" | "700" | "800" | "900";

export const HEADING_DIVIDER_WIDTH_PX: Record<HeadingDividerThickness, number> = {
	thin: 1,
	medium: 2,
	thick: 4,
	"extra-thick": 6,
};

/** Editor scrollbar widths: thick ≈ roomy; thin = practical minimum; medium midway. */
export const EDITOR_SCROLLBAR_WIDTH_PX: Record<EditorScrollbarThickness, number> = {
	thin: 6,
	medium: 12,
	thick: 20,
};

export const DEFAULT_CUSTOM_PALETTE_COLORS: PaletteColor[] = [
	{ name: "Ink", hex: "#232427" },
	{ name: "Paper", hex: "#F4F4F1" },
	{ name: "Rose", hex: "#E08C8C" },
	{ name: "Sage", hex: "#8FBF9A" },
	{ name: "Sky", hex: "#8FB0DE" },
];

/**
 * Settings owned by formatForge.
 * Palette, editor sizes, and scrollbar are local when standalone; when storyForge is
 * present those surfaces still prefer the host's linked settings API.
 */
export interface FormatForgeSettings {
	// ── Colour palette (used when storyForge is not present) ───────
	colorPaletteName: PaletteName;
	colorPaletteVariant: string;
	customPaletteColors: PaletteColor[];

	// ── Manuscript editor scrollbar ────────────────────────────────
	editorScrollbarThumbColor: string;
	editorScrollbarThickness: EditorScrollbarThickness;

	// ── Body text ──────────────────────────────────────────────────
	bodyTextOverrideSize: boolean;
	bodyTextSize: number;
	bodyTextOverrideColor: boolean;
	bodyTextColor: string;
	bodyTextOverrideFont: boolean;
	bodyTextFontFamily: string;
	bodyTextFontWeight: FontWeight;
	/** Governs the Bold colour swatch only; Italic has its own flag below (each swatch's own "Theme default" entry is independent). */
	bodyTextOverrideEmphasisColor: boolean;
	bodyTextBoldColor: string;
	bodyTextOverrideItalicColor: boolean;
	bodyTextItalicColor: string;
	bodyLinkOverrideColor: boolean;
	bodyLinkColor: string;
	bodyLinkOverrideHoverColor: boolean;
	bodyLinkHoverColor: string;
	bodyLinkRemoveUnderline: boolean;
	/** Governs the Highlight colour (background) swatch only; text has its own flag below. */
	bodyHighlightOverride: boolean;
	bodyHighlightBgColor: string;
	bodyHighlightOverrideText: boolean;
	bodyHighlightTextColor: string;

	// ── Body: code ─────────────────────────────────────────────────
	codeOverrideSize: boolean;
	codeSize: number;
	codeOverrideColor: boolean;
	codeColor: string;
	codeOverrideFont: boolean;
	codeFontFamily: string;
	codeFontWeight: FontWeight;
	codeOverrideBg: boolean;
	codeBgColor: string;

	// ── Body: block quote ──────────────────────────────────────────
	blockquoteOverrideSize: boolean;
	blockquoteSize: number;
	blockquoteOverrideColor: boolean;
	blockquoteColor: string;
	blockquoteOverrideFont: boolean;
	blockquoteFontFamily: string;
	blockquoteFontWeight: FontWeight;
	blockquoteOverrideBg: boolean;
	blockquoteBgColor: string;
	blockquoteOverrideBorder: boolean;
	blockquoteBorderColor: string;

	// ── Body: list markers ─────────────────────────────────────────
	orderedListOverrideColor: boolean;
	orderedListColor: string;
	unorderedListOverrideColor: boolean;
	unorderedListColor: string;

	// ── Heading 1 ──────────────────────────────────────────────────
	hideHeading1Links: boolean;
	heading1OverrideSize: boolean;
	heading1Size: number;
	heading1OverrideColor: boolean;
	heading1Color: string;
	heading1OverrideFont: boolean;
	heading1FontFamily: string;
	heading1FontWeight: FontWeight;
	heading1SmallCaps: boolean;
	heading1DividerAbove: boolean;
	heading1DividerAboveThickness: HeadingDividerThickness;
	heading1DividerBelow: boolean;
	heading1DividerBelowThickness: HeadingDividerThickness;

	// ── Heading 2 ──────────────────────────────────────────────────
	heading2OverrideSize: boolean;
	heading2Size: number;
	heading2OverrideColor: boolean;
	heading2Color: string;
	heading2OverrideFont: boolean;
	heading2FontFamily: string;
	heading2FontWeight: FontWeight;
	heading2SmallCaps: boolean;
	heading2DividerAbove: boolean;
	heading2DividerAboveThickness: HeadingDividerThickness;
	heading2DividerBelow: boolean;
	heading2DividerBelowThickness: HeadingDividerThickness;

	// ── Heading 3 ──────────────────────────────────────────────────
	heading3OverrideSize: boolean;
	heading3Size: number;
	heading3OverrideColor: boolean;
	heading3Color: string;
	heading3OverrideFont: boolean;
	heading3FontFamily: string;
	heading3FontWeight: FontWeight;
	heading3SmallCaps: boolean;
	heading3DividerAbove: boolean;
	heading3DividerAboveThickness: HeadingDividerThickness;
	heading3DividerBelow: boolean;
	heading3DividerBelowThickness: HeadingDividerThickness;

	// ── Heading 4 ──────────────────────────────────────────────────
	heading4OverrideSize: boolean;
	heading4Size: number;
	heading4OverrideColor: boolean;
	heading4Color: string;
	heading4OverrideFont: boolean;
	heading4FontFamily: string;
	heading4FontWeight: FontWeight;
	heading4SmallCaps: boolean;
	heading4DividerAbove: boolean;
	heading4DividerAboveThickness: HeadingDividerThickness;
	heading4DividerBelow: boolean;
	heading4DividerBelowThickness: HeadingDividerThickness;

	// ── Heading 5 ──────────────────────────────────────────────────
	heading5OverrideSize: boolean;
	heading5Size: number;
	heading5OverrideColor: boolean;
	heading5Color: string;
	heading5OverrideFont: boolean;
	heading5FontFamily: string;
	heading5FontWeight: FontWeight;
	heading5SmallCaps: boolean;
	heading5DividerAbove: boolean;
	heading5DividerAboveThickness: HeadingDividerThickness;
	heading5DividerBelow: boolean;
	heading5DividerBelowThickness: HeadingDividerThickness;

	// ── Heading 6 ──────────────────────────────────────────────────
	heading6OverrideSize: boolean;
	heading6Size: number;
	heading6OverrideColor: boolean;
	heading6Color: string;
	heading6OverrideFont: boolean;
	heading6FontFamily: string;
	heading6FontWeight: FontWeight;
	heading6SmallCaps: boolean;
	heading6DividerAbove: boolean;
	heading6DividerAboveThickness: HeadingDividerThickness;
	heading6DividerBelow: boolean;
	heading6DividerBelowThickness: HeadingDividerThickness;
}

export const DEFAULT_SETTINGS: FormatForgeSettings = {
	// Palette
	colorPaletteName: "Custom",
	colorPaletteVariant: "",
	customPaletteColors: DEFAULT_CUSTOM_PALETTE_COLORS.map((c) => ({ ...c })),

	// Scrollbar
	editorScrollbarThumbColor: "#6b7280",
	editorScrollbarThickness: "thick",

	// Body
	bodyTextOverrideSize: false,
	bodyTextSize: 1,
	bodyTextOverrideColor: false,
	bodyTextColor: "#d4d4d4",
	bodyTextOverrideFont: false,
	bodyTextFontFamily: "ibm-plex-sans-var",
	bodyTextFontWeight: "400",
	bodyTextOverrideEmphasisColor: false,
	bodyTextBoldColor: "#ffffff",
	bodyTextOverrideItalicColor: false,
	bodyTextItalicColor: "#c8c8c8",
	bodyLinkOverrideColor: false,
	bodyLinkColor: "#7eb8da",
	bodyLinkOverrideHoverColor: false,
	bodyLinkHoverColor: "#a8d4ef",
	bodyLinkRemoveUnderline: false,
	bodyHighlightOverride: false,
	bodyHighlightBgColor: "#e0af68",
	bodyHighlightOverrideText: false,
	bodyHighlightTextColor: "#1a1a1a",

	// Code
	codeOverrideSize: false,
	codeSize: 1,
	codeOverrideColor: false,
	codeColor: "#d4d4d4",
	codeOverrideFont: false,
	codeFontFamily: "courier-prime",
	codeFontWeight: "400",
	codeOverrideBg: false,
	codeBgColor: "#2a2a2a",

	// Block quote
	blockquoteOverrideSize: false,
	blockquoteSize: 1,
	blockquoteOverrideColor: false,
	blockquoteColor: "#d4d4d4",
	blockquoteOverrideFont: false,
	blockquoteFontFamily: "ibm-plex-sans-var",
	blockquoteFontWeight: "400",
	blockquoteOverrideBg: false,
	blockquoteBgColor: "#2a2a2a",
	blockquoteOverrideBorder: false,
	blockquoteBorderColor: "#7eb8da",

	// List markers
	orderedListOverrideColor: false,
	orderedListColor: "#7eb8da",
	unorderedListOverrideColor: false,
	unorderedListColor: "#7eb8da",

	// H1
	hideHeading1Links: false,
	heading1OverrideSize: false,
	heading1Size: 1,
	heading1OverrideColor: false,
	heading1Color: "#ffffff",
	heading1OverrideFont: false,
	heading1FontFamily: "ibm-plex-sans-var",
	heading1FontWeight: "700",
	heading1SmallCaps: false,
	heading1DividerAbove: false,
	heading1DividerAboveThickness: "thin",
	heading1DividerBelow: false,
	heading1DividerBelowThickness: "thin",

	// H2
	heading2OverrideSize: false,
	heading2Size: 1,
	heading2OverrideColor: false,
	heading2Color: "#eeeeee",
	heading2OverrideFont: false,
	heading2FontFamily: "ibm-plex-sans-var",
	heading2FontWeight: "600",
	heading2SmallCaps: false,
	heading2DividerAbove: false,
	heading2DividerAboveThickness: "thin",
	heading2DividerBelow: false,
	heading2DividerBelowThickness: "thin",

	// H3
	heading3OverrideSize: false,
	heading3Size: 1,
	heading3OverrideColor: false,
	heading3Color: "#dddddd",
	heading3OverrideFont: false,
	heading3FontFamily: "ibm-plex-sans-var",
	heading3FontWeight: "600",
	heading3SmallCaps: false,
	heading3DividerAbove: false,
	heading3DividerAboveThickness: "thin",
	heading3DividerBelow: false,
	heading3DividerBelowThickness: "thin",

	// H4
	heading4OverrideSize: false,
	heading4Size: 1,
	heading4OverrideColor: false,
	heading4Color: "#cccccc",
	heading4OverrideFont: false,
	heading4FontFamily: "ibm-plex-sans-var",
	heading4FontWeight: "500",
	heading4SmallCaps: false,
	heading4DividerAbove: false,
	heading4DividerAboveThickness: "thin",
	heading4DividerBelow: false,
	heading4DividerBelowThickness: "thin",

	// H5
	heading5OverrideSize: false,
	heading5Size: 1,
	heading5OverrideColor: false,
	heading5Color: "#bbbbbb",
	heading5OverrideFont: false,
	heading5FontFamily: "ibm-plex-sans-var",
	heading5FontWeight: "500",
	heading5SmallCaps: false,
	heading5DividerAbove: false,
	heading5DividerAboveThickness: "thin",
	heading5DividerBelow: false,
	heading5DividerBelowThickness: "thin",

	// H6
	heading6OverrideSize: false,
	heading6Size: 1,
	heading6OverrideColor: false,
	heading6Color: "#aaaaaa",
	heading6OverrideFont: false,
	heading6FontFamily: "ibm-plex-sans-var",
	heading6FontWeight: "400",
	heading6SmallCaps: false,
	heading6DividerAbove: false,
	heading6DividerAboveThickness: "thin",
	heading6DividerBelow: false,
	heading6DividerBelowThickness: "thin",
};
