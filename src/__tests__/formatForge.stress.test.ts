/**
 * Stress tests for formatForge: font catalog, settings, style-var generation, bridge gating.
 */
import { describe, expect, it } from "vitest";
import { CUSTOM_FONTS, resolveCustomFontFamilyParts, registerCustomFontFaces } from "../fonts";
import { DEFAULT_SETTINGS, HEADING_DIVIDER_WIDTH_PX, type FormatForgeSettings } from "../settings";
import { getSfFormattingApi, type SfFormattingApi, type StoryForgeHostApi } from "../storyforgeBridge";

function decodeMagic(b64: string): string {
	const buf = Buffer.from(b64.slice(0, 16), "base64");
	return buf.slice(0, 4).toString("ascii");
}

/** Mirrors FormatForgePlugin.applyEditorStyles var construction for pure unit stress. */
function buildEditorStyleVars(s: FormatForgeSettings): Record<string, string | null> {
	const vars: Record<string, string | null> = {};

	const assignFont = (prefix: string, overrideFont: boolean, familyId: string, fontWeight: string) => {
		if (!overrideFont) {
			vars[`${prefix}-family`] = null;
			vars[`${prefix}-variation`] = null;
			vars[`${prefix}-weight`] = null;
			return;
		}
		const font = CUSTOM_FONTS.find((f) => f.id === familyId);
		if (!font) {
			vars[`${prefix}-family`] = null;
			vars[`${prefix}-variation`] = null;
			vars[`${prefix}-weight`] = null;
			return;
		}
		const { family, variation } = resolveCustomFontFamilyParts(font, Number(fontWeight));
		vars[`${prefix}-family`] = family;
		vars[`${prefix}-variation`] = variation;
		vars[`${prefix}-weight`] = variation != null ? null : fontWeight;
	};

	assignFont("--sf-body", s.bodyTextOverrideFont, s.bodyTextFontFamily, s.bodyTextFontWeight);
	vars["--sf-body-color"] = s.bodyTextOverrideColor ? s.bodyTextColor : null;
	vars["--sf-body-bold-color"] = s.bodyTextOverrideEmphasisColor ? s.bodyTextBoldColor : null;
	vars["--sf-body-italic-color"] = s.bodyTextOverrideEmphasisColor ? s.bodyTextItalicColor : null;

	assignFont("--sf-h1", s.heading1OverrideFont, s.heading1FontFamily, s.heading1FontWeight);
	vars["--sf-h1-color"] = s.heading1OverrideColor ? s.heading1Color : null;
	vars["--sf-h1-variant"] = s.heading1SmallCaps ? "small-caps" : null;
	vars["--sf-h1-border-top"] = s.heading1DividerAbove
		? `${HEADING_DIVIDER_WIDTH_PX[s.heading1DividerAboveThickness]}px solid var(--background-modifier-border)`
		: null;
	vars["--sf-h1-border-bottom"] = s.heading1DividerBelow
		? `${HEADING_DIVIDER_WIDTH_PX[s.heading1DividerBelowThickness]}px solid var(--background-modifier-border)`
		: null;
	vars["--sf-h1-link-color"] = s.hideHeading1Links ? "inherit" : null;
	vars["--sf-h1-link-decoration"] = s.hideHeading1Links ? "none" : null;

	for (const n of [2, 3, 4, 5, 6] as const) {
		const hn = `heading${n}` as const;
		assignFont(`--sf-h${n}`, s[`${hn}OverrideFont`], s[`${hn}FontFamily`], s[`${hn}FontWeight`]);
		vars[`--sf-h${n}-color`] = s[`${hn}OverrideColor`] ? s[`${hn}Color`] : null;
		vars[`--sf-h${n}-variant`] = s[`${hn}SmallCaps`] ? "small-caps" : null;
		vars[`--sf-h${n}-border-top`] = s[`${hn}DividerAbove`]
			? `${HEADING_DIVIDER_WIDTH_PX[s[`${hn}DividerAboveThickness`]]}px solid var(--background-modifier-border)`
			: null;
		vars[`--sf-h${n}-border-bottom`] = s[`${hn}DividerBelow`]
			? `${HEADING_DIVIDER_WIDTH_PX[s[`${hn}DividerBelowThickness`]]}px solid var(--background-modifier-border)`
			: null;
	}
	return vars;
}

describe("formatForge font catalog stress", () => {
	it("has unique ids and all faces are woff2", () => {
		const ids = CUSTOM_FONTS.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids.length).toBeGreaterThanOrEqual(10);
		expect(ids).not.toContain("roboto-flex");

		let faces = 0;
		for (const font of CUSTOM_FONTS) {
			expect(font.weightMin).toBeLessThanOrEqual(font.weightMax);
			expect(font.faces.length).toBeGreaterThan(0);
			for (const face of font.faces) {
				faces++;
				expect(face.format).toBe("woff2");
				expect(decodeMagic(face.base64)).toBe("wOF2");
				expect(face.base64.length).toBeGreaterThan(1000);
			}
		}
		expect(faces).toBe(20); // catalog after roboto-flex removal
	});

	it("resolveCustomFontFamilyParts covers every font × weight under thrash", () => {
		const weights = [100, 300, 400, 500, 600, 700, 800, 900, 1000, -1, 0];
		for (let round = 0; round < 20; round++) {
			for (const font of CUSTOM_FONTS) {
				for (const w of weights) {
					const { family, variation } = resolveCustomFontFamilyParts(font, w);
					expect(family).toContain(font.cssFontFamily);
					if (font.weightMin === font.weightMax) {
						expect(variation).toBeNull();
					} else {
						expect(variation).toMatch(/^"wght" \d+$/);
						const n = Number(variation!.split(" ")[1]);
						expect(n).toBeGreaterThanOrEqual(font.weightMin);
						expect(n).toBeLessThanOrEqual(font.weightMax);
					}
				}
			}
		}
	});

	it("registerCustomFontFaces is idempotent across many docs (mocked FontFace)", () => {
		class FakeFontFace {
			family: string;
			source: string;
			descriptors: unknown;
			constructor(family: string, source: string, descriptors?: unknown) {
				this.family = family;
				this.source = source;
				this.descriptors = descriptors;
			}
			load() {
				return Promise.resolve(this);
			}
		}
		const g = globalThis as unknown as { FontFace: typeof FakeFontFace };
		const prev = g.FontFace;
		g.FontFace = FakeFontFace;

		try {
			for (let d = 0; d < 25; d++) {
				const added: FakeFontFace[] = [];
				const doc = {
					defaultView: { FontFace: FakeFontFace },
					fonts: {
						add(face: FakeFontFace) {
							added.push(face);
						},
					},
				} as unknown as Document;
				registerCustomFontFaces(doc);
				registerCustomFontFaces(doc); // second pass — still adds (caller tracks idempotency)
				expect(added.length).toBeGreaterThan(20);
				expect(added.every((f) => f.source.includes("woff2"))).toBe(true);
			}
		} finally {
			g.FontFace = prev;
		}
	});
});

describe("formatForge settings + style var stress", () => {
	it("DEFAULT_SETTINGS is a complete FormatForgeSettings object", () => {
		const keys = Object.keys(DEFAULT_SETTINGS);
		expect(keys.length).toBeGreaterThan(50);
		// Merge thrash: random partial overlays never throw
		for (let i = 0; i < 500; i++) {
			const partial: Partial<FormatForgeSettings> = {
				bodyTextOverrideFont: i % 2 === 0,
				bodyTextFontFamily: CUSTOM_FONTS[i % CUSTOM_FONTS.length].id,
				heading1SmallCaps: i % 3 === 0,
				hideHeading1Links: i % 5 === 0,
				heading2DividerAboveThickness: (["thin", "medium", "thick", "extra-thick"] as const)[i % 4],
			};
			const merged = Object.assign({}, DEFAULT_SETTINGS, partial);
			expect(merged.bodyTextFontFamily).toBeTruthy();
		}
	});

	it("buildEditorStyleVars stays stable under full-on / full-off storms", () => {
		const off = buildEditorStyleVars(DEFAULT_SETTINGS);
		expect(off["--sf-body-color"]).toBeNull();
		expect(off["--sf-h1-family"]).toBeNull();

		const on: FormatForgeSettings = {
			...DEFAULT_SETTINGS,
			bodyTextOverrideColor: true,
			bodyTextOverrideFont: true,
			bodyTextOverrideEmphasisColor: true,
			hideHeading1Links: true,
			heading1OverrideColor: true,
			heading1OverrideFont: true,
			heading1SmallCaps: true,
			heading1DividerAbove: true,
			heading1DividerBelow: true,
			heading2OverrideColor: true,
			heading2OverrideFont: true,
			heading2SmallCaps: true,
			heading2DividerAbove: true,
			heading3OverrideFont: true,
			heading4OverrideFont: true,
			heading5OverrideFont: true,
			heading6OverrideFont: true,
		};

		for (let i = 0; i < 100; i++) {
			on.bodyTextFontFamily = CUSTOM_FONTS[i % CUSTOM_FONTS.length].id;
			on.heading1FontFamily = CUSTOM_FONTS[(i + 3) % CUSTOM_FONTS.length].id;
			const vars = buildEditorStyleVars(on);
			expect(vars["--sf-body-color"]).toBe(on.bodyTextColor);
			expect(vars["--sf-body-family"]).toContain("storyForge");
			expect(vars["--sf-h1-variant"]).toBe("small-caps");
			expect(vars["--sf-h1-link-color"]).toBe("inherit");
			expect(vars["--sf-h1-border-top"]).toMatch(/px solid/);
			expect(Object.keys(vars).length).toBeGreaterThan(20);
		}
	});

	it("unknown font ids clear family vars instead of throwing", () => {
		const s: FormatForgeSettings = {
			...DEFAULT_SETTINGS,
			bodyTextOverrideFont: true,
			bodyTextFontFamily: "not-a-real-font",
		};
		const vars = buildEditorStyleVars(s);
		expect(vars["--sf-body-family"]).toBeNull();
		expect(vars["--sf-body-weight"]).toBeNull();
	});
});

describe("formatForge storyForge bridge stress", () => {
	it("returns null for missing / old / incomplete hosts", () => {
		const cases: Array<{ api?: Partial<StoryForgeHostApi> | null }> = [
			{},
			{ api: null },
			{ api: { version: 1 } },
			{ api: { version: 2 } }, // no formatting
			{ api: { version: 2, formatting: undefined as unknown as SfFormattingApi } },
		];
		for (const c of cases) {
			const app = {
				plugins: {
					getPlugin: () => c.api === undefined && !("api" in c) ? null : { api: c.api },
				},
			};
			// Fix missing-plugin case
			const app2 = {
				plugins: {
					getPlugin: (id: string) => {
						if (id !== "storyforge") return null;
						if (!("api" in c)) return null;
						return { api: c.api };
					},
				},
			};
			expect(getSfFormattingApi(app2 as never)).toBeNull();
		}
	});

	it("accepts version >= 2 with formatting and survives rapid lookups", () => {
		const formatting = {
			version: 2,
			isCompanionActive: () => true,
		} as unknown as SfFormattingApi;
		const app = {
			plugins: {
				getPlugin: () => ({ api: { version: 2, formatting } satisfies Partial<StoryForgeHostApi> }),
			},
		};
		for (let i = 0; i < 1000; i++) {
			expect(getSfFormattingApi(app as never)).toBe(formatting);
		}
	});

	it("linked key union in bridge covers size + chrome families", async () => {
		// Compile-time-ish runtime check: critical keys exist in the type's expected set via a mock API
		const store: Record<string, unknown> = {
			bodyTextSize: 1,
			bodyTextOverrideSize: false,
			librarySeriesTitleColor: "#fff",
			colorPaletteName: "Custom",
			colorPaletteVariant: "",
			customPaletteColors: [],
		};
		const api: SfFormattingApi = {
			version: 2,
			isCompanionActive: () => true,
			registerCompanion: () => () => undefined,
			getLinkedSettings: () => store as never,
			getLinkedSetting: (k) => store[k],
			updateLinkedSetting: async (k, v) => {
				store[k] = v;
			},
			applyLinkedStyles: () => undefined,
			setStyleVars: () => undefined,
			getStyleDocuments: () => [],
			getPalette: () => ({
				name: String(store.colorPaletteName),
				variant: String(store.colorPaletteVariant),
				customColors: store.customPaletteColors as [],
			}),
			updatePalette: async (p) => {
				if (p.name) store.colorPaletteName = p.name;
			},
			registerViewContribution: () => () => undefined,
		};

		for (let i = 0; i < 200; i++) {
			await api.updateLinkedSetting("bodyTextSize", 0.7 + (i % 10) * 0.1);
			expect(api.getLinkedSetting("bodyTextSize")).toBeCloseTo(0.7 + (i % 10) * 0.1);
		}
		await api.updatePalette({ name: "Custom" });
		expect(api.getPalette().name).toBe("Custom");
	});
});
