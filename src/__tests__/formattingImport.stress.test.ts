import { describe, expect, it, vi } from "vitest";
import {
	buildFormattingExport,
	type FormattingExportSelection,
} from "../formattingExport";
import {
	applyFormattingDocument,
	type FormattingImportHost,
} from "../formattingImport";
import { DEFAULT_SETTINGS } from "../settings";
import type {
	SfFormattingApi,
	SfLinkedFormattingKey,
} from "../storyforgeBridge";

function makeHarness(connected: boolean) {
	const linkedStore: Record<string, unknown> = {
		bodyTextSize: 1,
		cyclingGuideColor: "#000000",
		recommendHeaderColor: "#111111",
		recommendSynopsisFontSize: 1,
	};
	const updates: Array<[string, unknown]> = [];
	const palettes: unknown[] = [];
	const localImports: Array<Record<string, unknown>> = [];
	const applyLinkedStyles = vi.fn();
	const api = {
		version: 7,
		getLinkedSettings: () => ({ ...linkedStore }),
		updateLinkedSetting: async (key: SfLinkedFormattingKey, value: unknown) => {
			linkedStore[key] = value;
			updates.push([key, value]);
		},
		updatePalette: async (palette: unknown) => {
			palettes.push(palette);
		},
		applyLinkedStyles,
	} as unknown as SfFormattingApi;
	let apiRef: SfFormattingApi | null = connected ? api : null;
	const host: FormattingImportHost = {
		async importTextStylingSettings(data: unknown) {
			localImports.push({ ...(data as Record<string, unknown>) });
			return [];
		},
		getStoryForgeApi: () => apiRef,
	};
	return {
		host,
		api,
		linkedStore,
		updates,
		palettes,
		localImports,
		applyLinkedStyles,
		connect: () => {
			apiRef = api;
		},
		disconnect: () => {
			apiRef = null;
		},
	};
}

const LINKED = {
	bodyTextSize: 1.4,
	cyclingGuideColor: "#123456",
	recommendHeaderColor: "#abcdef",
	recommendSynopsisFontSize: 0.9,
	colorPaletteName: "Custom",
	colorPaletteVariant: "",
	customPaletteColors: [{ name: "Ink", hex: "#111111" }],
} as unknown as Record<SfLinkedFormattingKey, unknown>;

describe("formatForge → storyForge formatting import stress", () => {
	it("applies every section combination to the correct owner", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		for (let bits = 1; bits < 8; bits++) {
			const selected: FormattingExportSelection = {
				textStyling: (bits & 1) !== 0,
				storyForgeInterface: (bits & 2) !== 0,
				palette: (bits & 4) !== 0,
			};
			for (let round = 0; round < 50; round++) {
				const harness = makeHarness(true);
				await applyFormattingDocument(harness.host, document, selected);

				expect(harness.localImports.length).toBe(
					selected.textStyling || selected.palette ? 1 : 0,
				);
				expect(
					harness.updates.some(([key]) => key === "bodyTextSize"),
				).toBe(selected.textStyling);
				expect(
					harness.updates.some(([key]) => key === "cyclingGuideColor"),
				).toBe(selected.textStyling);
				expect(
					harness.updates.some(([key]) => key === "recommendHeaderColor"),
				).toBe(selected.storyForgeInterface);
				expect(harness.palettes.length).toBe(selected.palette ? 1 : 0);
				expect(harness.applyLinkedStyles).toHaveBeenCalledTimes(
					selected.textStyling ||
						selected.storyForgeInterface ||
						selected.palette
						? 1
						: 0,
				);
			}
		}
	});

	it("rejects empty applies and keeps host updates ahead of local persistence", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const empty = makeHarness(true);
		await expect(
			applyFormattingDocument(empty.host, document, {
				textStyling: false,
				storyForgeInterface: false,
				palette: false,
			}),
		).rejects.toThrow("Nothing selected");

		const order: string[] = [];
		const linkedStore: Record<string, unknown> = {
			bodyTextSize: 1,
			recommendHeaderColor: "#111111",
		};
		const host: FormattingImportHost = {
			async importTextStylingSettings() {
				order.push("local");
				return [];
			},
			getStoryForgeApi: () =>
				({
					getLinkedSettings: () => ({ ...linkedStore }),
					updateLinkedSetting: async () => {
						order.push("linked");
					},
					updatePalette: async () => {
						order.push("palette");
					},
					applyLinkedStyles: () => {
						order.push("styles");
					},
				}) as unknown as SfFormattingApi,
		};
		await applyFormattingDocument(host, document, {
			textStyling: true,
			storyForgeInterface: true,
			palette: true,
		});
		expect(order.indexOf("linked")).toBeLessThan(order.indexOf("local"));
		expect(order.indexOf("palette")).toBeLessThan(order.indexOf("local"));
		expect(order.at(-1)).toBe("local");
	});

	it("does not bleed hand-edited palette keys through text styling apply", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED, new Date(), {
			included: { textStyling: true, storyForgeInterface: false, palette: false },
		});
		document.textStyling = {
			...document.textStyling,
			colorPaletteName: "Nord",
			customPaletteColors: [{ name: "Leak", hex: "#ff00ff" }],
		};
		const harness = makeHarness(true);
		await applyFormattingDocument(harness.host, document, {
			textStyling: true,
			storyForgeInterface: false,
			palette: false,
		});
		expect(harness.localImports[0]).not.toHaveProperty("colorPaletteName");
		expect(harness.localImports[0]).not.toHaveProperty("customPaletteColors");
		expect(harness.updates.every(([key]) => key !== "colorPaletteName")).toBe(true);
		expect(harness.palettes).toHaveLength(0);
	});

	it("aborts before local persistence when a linked update fails", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const localImports: unknown[] = [];
		const host: FormattingImportHost = {
			async importTextStylingSettings(data: unknown) {
				localImports.push(data);
				return [];
			},
			getStoryForgeApi: () =>
				({
					getLinkedSettings: () => ({
						bodyTextSize: 1,
						recommendHeaderColor: "#111111",
					}),
					updateLinkedSetting: async () => {
						throw new Error("invalid value for bodyTextSize");
					},
					updatePalette: async () => undefined,
					applyLinkedStyles: () => undefined,
				}) as unknown as SfFormattingApi,
		};
		await expect(
			applyFormattingDocument(host, document, {
				textStyling: true,
				storyForgeInterface: true,
				palette: true,
			}),
		).rejects.toThrow("bodyTextSize");
		expect(localImports).toHaveLength(0);
	});

	it("surfaces a divergence warning when the host write lands but the local save fails", async () => {
		// P2 #11: there's no distributed transaction across the two plugins. If the host
		// half of an apply already succeeded, a plain "apply failed" would wrongly imply
		// nothing happened — the error must say the two may now differ.
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const host: FormattingImportHost = {
			async importTextStylingSettings() {
				throw new Error("disk full");
			},
			getStoryForgeApi: () =>
				({
					getLinkedSettings: () => ({
						bodyTextSize: 1,
						recommendHeaderColor: "#111111",
					}),
					updateLinkedSetting: async () => undefined,
					updatePalette: async () => undefined,
					applyLinkedStyles: () => undefined,
				}) as unknown as SfFormattingApi,
		};
		await expect(
			applyFormattingDocument(host, document, {
				textStyling: true,
				storyForgeInterface: true,
				palette: true,
			}),
		).rejects.toThrow(/storyForge settings were applied.*disk full.*may now differ/s);
	});

	it("prefers API v8 batch updates for one atomic host write", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const patches: Array<Partial<Record<SfLinkedFormattingKey, unknown>>> = [];
		const localImports: unknown[] = [];
		const host: FormattingImportHost = {
			async importTextStylingSettings(data: unknown) {
				localImports.push(data);
				return [];
			},
			getStoryForgeApi: () =>
				({
					getLinkedSettings: () => ({
						bodyTextSize: 1,
						recommendHeaderColor: "#111111",
						colorPaletteName: "Custom",
						colorPaletteVariant: "",
						customPaletteColors: [],
					}),
					updateLinkedSettings: async (
						partial: Partial<Record<SfLinkedFormattingKey, unknown>>,
					) => {
						patches.push({ ...partial });
					},
					updateLinkedSetting: async () => {
						throw new Error("legacy update should not run");
					},
					updatePalette: async () => {
						throw new Error("legacy palette update should not run");
					},
					applyLinkedStyles: () => {
						throw new Error("batch host owns restyle");
					},
				}) as unknown as SfFormattingApi,
		};

		await applyFormattingDocument(host, document, {
			textStyling: true,
			storyForgeInterface: true,
			palette: true,
		});
		expect(patches).toHaveLength(1);
		expect(patches[0]).toMatchObject({
			bodyTextSize: 1.4,
			recommendHeaderColor: "#abcdef",
			colorPaletteName: "Custom",
			customPaletteColors: [{ name: "Ink", hex: "#111111" }],
		});
		expect(localImports).toHaveLength(1);
	});

	it("survives repeated disconnect and reconnect cycles without stale API writes", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const harness = makeHarness(false);
		const selected: FormattingExportSelection = {
			textStyling: true,
			storyForgeInterface: true,
			palette: true,
		};

		for (let i = 0; i < 200; i++) {
			if (i % 2 === 0) harness.connect();
			else harness.disconnect();
			const beforeUpdates = harness.updates.length;
			const beforePalettes = harness.palettes.length;
			await applyFormattingDocument(harness.host, document, selected);
			if (i % 2 === 0) {
				expect(harness.updates.length).toBeGreaterThan(beforeUpdates);
				expect(harness.palettes.length).toBe(beforePalettes + 1);
			} else {
				expect(harness.updates.length).toBe(beforeUpdates);
				expect(harness.palettes.length).toBe(beforePalettes);
			}
		}
		expect(harness.localImports).toHaveLength(200);
		expect(harness.applyLinkedStyles).toHaveBeenCalledTimes(100);
	});

	it("ignores document keys that the live storyForge API does not expose", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		document.storyForgeInterface = {
			...document.storyForgeInterface,
			notARealHostSetting: "injected",
		};
		const harness = makeHarness(true);
		await applyFormattingDocument(harness.host, document, {
			textStyling: false,
			storyForgeInterface: true,
			palette: false,
		});
		expect(harness.updates).toEqual([
			["recommendHeaderColor", "#abcdef"],
			["recommendSynopsisFontSize", 0.9],
		]);
		expect(harness.linkedStore).not.toHaveProperty("notARealHostSetting");
	});

	it("keeps palette and text import available while storyForge is absent", async () => {
		const document = buildFormattingExport(DEFAULT_SETTINGS, LINKED);
		const harness = makeHarness(false);
		await applyFormattingDocument(harness.host, document, {
			textStyling: true,
			storyForgeInterface: true,
			palette: true,
		});
		expect(harness.localImports).toHaveLength(1);
		expect(harness.localImports[0]).toMatchObject({
			bodyTextSize: 1.4,
			colorPaletteName: "Custom",
		});
		expect(harness.updates).toHaveLength(0);
		expect(harness.palettes).toHaveLength(0);
	});
});
