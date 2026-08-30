import { describe, expect, it } from "vitest";
import {
	buildFormattingExport,
	FORMATTING_EXPORT_FORMAT,
	FORMATTING_EXPORT_VERSION,
	parseFormattingExport,
	stringifyFormattingExport,
	type FormattingExportSelection,
} from "../formattingExport";
import { DEFAULT_SETTINGS } from "../settings";
import type { SfLinkedFormattingKey } from "../storyforgeBridge";

const LINKED = {
	bodyTextSize: 1.25,
	cyclingGuideColor: "#123456",
	recommendHeaderColor: "#abcdef",
	recommendSynopsisFontSize: 0.9,
	colorPaletteName: "Custom",
	colorPaletteVariant: "",
	customPaletteColors: [{ name: "Ink", hex: "#111111" }],
} as unknown as Record<SfLinkedFormattingKey, unknown>;

describe("formatForge formatting document stress", () => {
	it("round-trips every section combination without duplication", () => {
		for (let bits = 0; bits < 8; bits++) {
			const included: FormattingExportSelection = {
				textStyling: (bits & 1) !== 0,
				storyForgeInterface: (bits & 2) !== 0,
				palette: (bits & 4) !== 0,
			};
			for (let round = 0; round < 100; round++) {
				const document = buildFormattingExport(
					{
						...DEFAULT_SETTINGS,
						bodyTextSize: 0.8 + (round % 20) * 0.05,
					},
					LINKED,
					new Date(1_700_000_000_000 + round * 1000),
					{ description: ` Theme ${round} `, included },
				);
				const reparsed = parseFormattingExport(
					stringifyFormattingExport(document),
				);
				expect(reparsed).toEqual(document);
				expect(reparsed.included).toEqual(included);
				expect(reparsed.description).toBe(`Theme ${round}`);
				expect(reparsed.textStyling !== null).toBe(included.textStyling);
				expect(reparsed.storyForgeInterface !== null).toBe(
					included.storyForgeInterface,
				);
				expect(reparsed.palette !== null).toBe(included.palette);
				if (reparsed.textStyling) {
					expect(reparsed.textStyling).not.toHaveProperty("colorPaletteName");
					expect(reparsed.textStyling).not.toHaveProperty("cyclingGuideColor");
				}
				if (reparsed.storyForgeInterface) {
					expect(reparsed.storyForgeInterface).not.toHaveProperty(
						"colorPaletteName",
					);
					expect(reparsed.storyForgeInterface).not.toHaveProperty("bodyTextSize");
					expect(reparsed.storyForgeInterface).toHaveProperty("cyclingGuideColor");
				}
			}
		}
	});

	it("normalizes interface selection off while storyForge is disconnected", () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, null, new Date(), {
			included: {
				textStyling: false,
				storyForgeInterface: true,
				palette: false,
			},
		});
		expect(document.included.storyForgeInterface).toBe(false);
		expect(document.storyForgeInterface).toBeNull();
		expect(parseFormattingExport(stringifyFormattingExport(document))).toEqual(
			document,
		);
	});

	it("migrates a large version 1 corpus deterministically", () => {
		for (let i = 0; i < 500; i++) {
			const migrated = parseFormattingExport(
				JSON.stringify({
					format: FORMATTING_EXPORT_FORMAT,
					version: 1,
					exportedAt: new Date(1_700_000_000_000 + i).toISOString(),
					textStyling: {
						...DEFAULT_SETTINGS,
						bodyTextSize: 1 + (i % 10) / 10,
					},
					storyForgeInterface: {
						...LINKED,
						recommendHeaderColor: `#${(i % 0xffffff)
							.toString(16)
							.padStart(6, "0")}`,
					},
				}),
			);
			expect(migrated.version).toBe(FORMATTING_EXPORT_VERSION);
			expect(migrated.textStyling?.bodyTextSize).toBe(LINKED.bodyTextSize);
			expect(migrated.textStyling).not.toHaveProperty("cyclingGuideColor");
			expect(migrated.storyForgeInterface?.cyclingGuideColor).toBe(
				LINKED.cyclingGuideColor,
			);
			expect(migrated.storyForgeInterface?.recommendHeaderColor).toMatch(
				/^#[0-9a-f]{6}$/,
			);
			expect(migrated.palette?.customPaletteColors).toEqual(
				LINKED.customPaletteColors,
			);
		}
	});

	it("rejects malformed or internally inconsistent version 3 documents", () => {
		const valid = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const mutations: Array<(value: Record<string, unknown>) => void> = [
			(value) => {
				value.exportedAt = "not-a-date";
			},
			(value) => {
				value.description = 42;
			},
			(value) => {
				value.included = { textStyling: "yes", storyForgeInterface: true, palette: true };
			},
			(value) => {
				value.textStyling = [];
			},
			(value) => {
				value.storyForgeInterface = "bad";
			},
			(value) => {
				value.palette = {
					colorPaletteName: "Custom",
					colorPaletteVariant: "",
					customPaletteColors: [{ name: "Ink", hex: 12 }],
				};
			},
			(value) => {
				value.included = {
					textStyling: false,
					storyForgeInterface: true,
					palette: true,
				};
			},
		];
		for (const mutate of mutations) {
			const value = JSON.parse(JSON.stringify(valid)) as Record<string, unknown>;
			mutate(value);
			expect(() => parseFormattingExport(JSON.stringify(value))).toThrow();
		}
	});
});
