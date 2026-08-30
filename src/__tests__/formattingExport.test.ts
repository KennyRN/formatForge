import { describe, expect, it } from "vitest";
import {
	buildFormattingExport,
	FORMATTING_EXPORT_FORMAT,
	FORMATTING_EXPORT_VERSION,
	parseFormattingExport,
	stringifyFormattingExport,
} from "../formattingExport";
import { DEFAULT_SETTINGS } from "../settings";
import type { SfLinkedFormattingKey } from "../storyforgeBridge";

describe("formatting export", () => {
	it("includes complete text styling and storyForge interface snapshots", () => {
		const linked = {
			recommendHeaderColor: "#abcdef",
			bodyTextSize: 1.25,
		} as Record<SfLinkedFormattingKey, unknown>;
		const when = new Date("2026-08-05T10:30:00.000Z");

		const document = buildFormattingExport(DEFAULT_SETTINGS, linked, when);

		expect(document.format).toBe(FORMATTING_EXPORT_FORMAT);
		expect(document.version).toBe(FORMATTING_EXPORT_VERSION);
		expect(document.exportedAt).toBe("2026-08-05T10:30:00.000Z");
		expect(document.textStyling).toMatchObject({
			bodyTextSize: 1.25,
			heading1Color: DEFAULT_SETTINGS.heading1Color,
		});
		expect(document.textStyling).not.toHaveProperty("customPaletteColors");
		expect(document.storyForgeInterface).toEqual({ recommendHeaderColor: "#abcdef" });
		expect(document.palette).toEqual({
			colorPaletteName: DEFAULT_SETTINGS.colorPaletteName,
			colorPaletteVariant: DEFAULT_SETTINGS.colorPaletteVariant,
			customPaletteColors: DEFAULT_SETTINGS.customPaletteColors,
		});
		expect(parseFormattingExport(stringifyFormattingExport(document))).toEqual(document);
	});

	it("marks the storyForge interface section unavailable when disconnected", () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, null);
		expect(document.storyForgeInterface).toBeNull();
		expect(document.included.storyForgeInterface).toBe(false);
	});

	it("supports descriptions and partial section exports", () => {
		const document = buildFormattingExport(
			DEFAULT_SETTINGS,
			{ recommendHeaderColor: "#abcdef" } as Record<SfLinkedFormattingKey, unknown>,
			new Date("2026-08-05T10:30:00.000Z"),
			{
				description: "  Nord writing theme  ",
				included: { textStyling: false, storyForgeInterface: true, palette: false },
			},
		);
		expect(document.description).toBe("Nord writing theme");
		expect(document.textStyling).toBeNull();
		expect(document.storyForgeInterface).toEqual({ recommendHeaderColor: "#abcdef" });
		expect(document.palette).toBeNull();
	});

	it("migrates version 1 exports into independently selectable sections", () => {
		const migrated = parseFormattingExport(JSON.stringify({
			format: FORMATTING_EXPORT_FORMAT,
			version: 1,
			exportedAt: "2026-08-05T10:30:00.000Z",
			textStyling: DEFAULT_SETTINGS,
			storyForgeInterface: {
				bodyTextSize: 1.3,
				recommendHeaderColor: "#abcdef",
			},
		}));
		expect(migrated.version).toBe(FORMATTING_EXPORT_VERSION);
		expect(migrated.textStyling).toMatchObject({ bodyTextSize: 1.3 });
		expect(migrated.storyForgeInterface).toEqual({ recommendHeaderColor: "#abcdef" });
		expect(migrated.palette?.colorPaletteName).toBe(DEFAULT_SETTINGS.colorPaletteName);
	});

	it("migrates version 2 cycling-guide keys into the storyForge interface section", () => {
		const migrated = parseFormattingExport(
			JSON.stringify({
				format: FORMATTING_EXPORT_FORMAT,
				version: 2,
				exportedAt: "2026-08-05T10:30:00.000Z",
				included: {
					textStyling: true,
					storyForgeInterface: true,
					palette: false,
				},
				textStyling: {
					bodyTextSize: 1.2,
					cyclingGuideColor: "#123456",
					cyclingGuideEnabled: true,
				},
				storyForgeInterface: { recommendHeaderColor: "#abcdef" },
				palette: null,
			}),
		);
		expect(migrated.version).toBe(FORMATTING_EXPORT_VERSION);
		expect(migrated.textStyling).toEqual({ bodyTextSize: 1.2 });
		expect(migrated.storyForgeInterface).toEqual({
			recommendHeaderColor: "#abcdef",
			cyclingGuideColor: "#123456",
			cyclingGuideEnabled: true,
		});
	});

	it("creates an interface section when a version 2 text-only export held cycling-guide keys", () => {
		const migrated = parseFormattingExport(
			JSON.stringify({
				format: FORMATTING_EXPORT_FORMAT,
				version: 2,
				exportedAt: "2026-08-05T10:30:00.000Z",
				included: {
					textStyling: true,
					storyForgeInterface: false,
					palette: false,
				},
				textStyling: { bodyTextSize: 1.1, cyclingGuideInterval: "large" },
				storyForgeInterface: null,
				palette: null,
			}),
		);
		expect(migrated.included.storyForgeInterface).toBe(true);
		expect(migrated.textStyling).toEqual({ bodyTextSize: 1.1 });
		expect(migrated.storyForgeInterface).toEqual({ cyclingGuideInterval: "large" });
	});

	it("rejects unrelated or unsupported JSON", () => {
		expect(() => parseFormattingExport("{}")).toThrow("not a formatForge");
		expect(() =>
			parseFormattingExport(
				JSON.stringify({
					format: FORMATTING_EXPORT_FORMAT,
					version: 99,
					textStyling: {},
					storyForgeInterface: null,
				}),
			),
		).toThrow("Unsupported");
	});

	it("strips hand-edited palette keys out of text styling during parse", () => {
		const parsed = parseFormattingExport(
			JSON.stringify({
				format: FORMATTING_EXPORT_FORMAT,
				version: FORMATTING_EXPORT_VERSION,
				exportedAt: "2026-08-05T10:30:00.000Z",
				included: {
					textStyling: true,
					storyForgeInterface: false,
					palette: false,
				},
				textStyling: {
					bodyTextSize: 1.2,
					colorPaletteName: "Nord",
					customPaletteColors: [{ name: "Leak", hex: "#ff00ff" }],
				},
				storyForgeInterface: null,
				palette: null,
			}),
		);
		expect(parsed.textStyling).toEqual({ bodyTextSize: 1.2 });
		expect(parsed.palette).toBeNull();
	});
});
