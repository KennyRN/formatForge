import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../settings";
import { coerceSettings, isValidSettingValue } from "../settingsValidation";

// Covers audit finding P1 #3 ("Untyped local import / load can corrupt persisted
// settings"): hand-edited or downgraded data.json / theme JSON must not be able to
// smuggle a bad enum, non-finite number, or wrong-typed value into a CSS variable.

describe("settingsValidation", () => {
	it("accepts every value in DEFAULT_SETTINGS", () => {
		for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
			expect(isValidSettingValue(key, value), `default rejected for ${key}`).toBe(true);
		}
	});

	it("rejects an unknown key", () => {
		expect(isValidSettingValue("notARealSetting", "x")).toBe(false);
	});

	it.each([
		["heading1DividerAboveThickness", "ultra-thick"], // not in the enum
		["heading1DividerAboveThickness", 4], // wrong type
		["bodyTextFontWeight", "450"], // not one of the allowed weights
		["bodyTextSize", 0], // must be > 0
		["bodyTextSize", -1],
		["bodyTextSize", Number.POSITIVE_INFINITY], // must be finite
		["bodyTextSize", "1.2"], // string, not number
		["bodyTextOverrideSize", "true"], // string, not boolean
		["colorPaletteName", "NotAPalette"],
		["bodyTextColor", ""], // non-empty string required
		["customPaletteColors", [{ name: "x" }]], // missing hex
		["customPaletteColors", "red"], // not an array at all
		["editorScrollbarThickness", "extra-thick"], // valid divider thickness, invalid scrollbar thickness
	])("rejects %s = %j", (key, value) => {
		expect(isValidSettingValue(key, value)).toBe(false);
	});

	it("coerceSettings keeps only the valid incoming keys and reports the rest as rejected", () => {
		const base: typeof DEFAULT_SETTINGS = {
			...DEFAULT_SETTINGS,
			customPaletteColors: DEFAULT_SETTINGS.customPaletteColors.map((c) => ({ ...c })),
		};
		const { settings, rejected } = coerceSettings(base, {
			bodyTextSize: 1.5, // valid
			bodyTextOverrideSize: true, // valid
			heading1DividerAboveThickness: "not-real", // invalid enum
			bodyTextFontWeight: 700, // wrong type (number, not the string "700")
			notARealSetting: "ignored silently, not counted as rejected", // unknown key
		});

		expect(settings.bodyTextSize).toBe(1.5);
		expect(settings.bodyTextOverrideSize).toBe(true);
		// Rejected keys fall back to whatever `base` held.
		expect(settings.heading1DividerAboveThickness).toBe(base.heading1DividerAboveThickness);
		expect(settings.bodyTextFontWeight).toBe(base.bodyTextFontWeight);
		expect(rejected.sort()).toEqual(["bodyTextFontWeight", "heading1DividerAboveThickness"]);
	});

	it("coerceSettings never produces the undefinedpx-style bug: a bad thickness cannot survive", () => {
		const base: typeof DEFAULT_SETTINGS = {
			...DEFAULT_SETTINGS,
			customPaletteColors: [],
		};
		const { settings } = coerceSettings(base, {
			heading1DividerAbove: true,
			heading1DividerAboveThickness: undefined,
		});
		expect(settings.heading1DividerAboveThickness).not.toBeUndefined();
		expect(["thin", "medium", "thick", "extra-thick"]).toContain(
			settings.heading1DividerAboveThickness,
		);
	});

	it("coerceSettings deep-copies customPaletteColors so callers can't mutate the base", () => {
		const base: typeof DEFAULT_SETTINGS = {
			...DEFAULT_SETTINGS,
			customPaletteColors: [{ name: "Accent", hex: "#111111" }],
		};
		const { settings } = coerceSettings(base, {});
		settings.customPaletteColors[0].hex = "#ffffff";
		expect(base.customPaletteColors[0].hex).toBe("#111111");
	});
});
