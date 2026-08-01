export type HeadingDividerThickness = "thin" | "medium" | "thick" | "extra-thick";
export type FontWeight = "300" | "400" | "500" | "600" | "700" | "800" | "900";

export const HEADING_DIVIDER_WIDTH_PX: Record<HeadingDividerThickness, number> = {
	thin: 1,
	medium: 2,
	thick: 4,
	"extra-thick": 6,
};

/** Settings owned exclusively by formatForge — editor typography only (no UI chrome, no sizes). */
export interface FormatForgeSettings {
	// ── Body text ──────────────────────────────────────────────────
	bodyTextOverrideColor: boolean;
	bodyTextColor: string;
	bodyTextOverrideFont: boolean;
	bodyTextFontFamily: string;
	bodyTextFontWeight: FontWeight;
	bodyTextOverrideEmphasisColor: boolean;
	bodyTextBoldColor: string;
	bodyTextItalicColor: string;

	// ── Heading 1 ──────────────────────────────────────────────────
	hideHeading1Links: boolean;
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
	// Body
	bodyTextOverrideColor: false,
	bodyTextColor: "#d4d4d4",
	bodyTextOverrideFont: false,
	bodyTextFontFamily: "ibm-plex-sans-var",
	bodyTextFontWeight: "400",
	bodyTextOverrideEmphasisColor: false,
	bodyTextBoldColor: "#ffffff",
	bodyTextItalicColor: "#c8c8c8",

	// H1
	hideHeading1Links: false,
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
