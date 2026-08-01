import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, HEADING_DIVIDER_WIDTH_PX, type FormatForgeSettings } from "./settings";
import { getSfFormattingApi, type SfFormattingApi, type SfPaletteColor, type SfPaletteName } from "./storyforgeBridge";
import { getTfFormattingApi, type TfFormattingApi } from "./timelineForgeBridge";
import { CUSTOM_FONTS, registerCustomFontFaces, resolveCustomFontFamilyParts } from "./fonts";
import { FormatForgeSettingsTab } from "./view/FormatForgeSettingsTab";
import type { FontCardHost } from "./view/styleModalHelpers";

export default class FormatForgePlugin extends Plugin implements FontCardHost {
	private ffSettings: FormatForgeSettings = { ...DEFAULT_SETTINGS };
	private sfApi: SfFormattingApi | null = null;
	private tfApi: TfFormattingApi | null = null;
	private unregisterCompanion: (() => void) | null = null;
	private unregisterTimelineCompanion: (() => void) | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Wait for layout to be ready before trying to connect to host plugins
		this.app.workspace.onLayoutReady(() => {
			this.connectToStoryForge();
			this.connectToTimelineForge();
		});
	}

	onunload(): void {
		this.unregisterCompanion?.();
		this.unregisterCompanion = null;
		this.unregisterTimelineCompanion?.();
		this.unregisterTimelineCompanion = null;
		this.sfApi = null;
		this.tfApi = null;
	}

	// ── FontCardHost interface ─────────────────────────────────────────────

	getSettings(): Record<string, unknown> {
		return this.ffSettings as unknown as Record<string, unknown>; // safe: same shape, just without index signature
	}

	async updateSetting(key: string, value: unknown): Promise<void> {
		(this.ffSettings as unknown as Record<string, unknown>)[key] = value;
		await this.saveSettings();
	}

	// ── Typed settings access ──────────────────────────────────────────────

	getTypedSettings(): FormatForgeSettings {
		return this.ffSettings;
	}

	/** Palette from SF, or a fallback if SF is unavailable. */
	getPalette(): { name: SfPaletteName; variant: string; customColors: SfPaletteColor[] } {
		if (this.sfApi) return this.sfApi.getPalette();
		return { name: "Custom", variant: "", customColors: [] };
	}

	// ── Editor style application ───────────────────────────────────────────

	applyEditorStyles(): void {
		if (!this.sfApi) return;
		const s = this.ffSettings;
		const vars: Record<string, string | null> = {};

		// Body text
		this.assignEditorFontVars(vars, "--sf-body", s.bodyTextOverrideFont, s.bodyTextFontFamily, s.bodyTextFontWeight);
		vars["--sf-body-color"] = s.bodyTextOverrideColor ? s.bodyTextColor : null;
		vars["--sf-body-bold-color"] = s.bodyTextOverrideEmphasisColor ? s.bodyTextBoldColor : null;
		vars["--sf-body-italic-color"] = s.bodyTextOverrideEmphasisColor ? s.bodyTextItalicColor : null;

		// H1 — with link hiding
		this.assignEditorFontVars(vars, "--sf-h1", s.heading1OverrideFont, s.heading1FontFamily, s.heading1FontWeight);
		vars["--sf-h1-color"] = s.heading1OverrideColor ? s.heading1Color : null;
		vars["--sf-h1-variant"] = s.heading1SmallCaps ? "small-caps" : null;
		vars["--sf-h1-border-top"] = s.heading1DividerAbove ? `${HEADING_DIVIDER_WIDTH_PX[s.heading1DividerAboveThickness]}px solid var(--background-modifier-border)` : null;
		vars["--sf-h1-border-bottom"] = s.heading1DividerBelow ? `${HEADING_DIVIDER_WIDTH_PX[s.heading1DividerBelowThickness]}px solid var(--background-modifier-border)` : null;
		vars["--sf-h1-link-color"] = s.hideHeading1Links ? "inherit" : null;
		vars["--sf-h1-link-decoration"] = s.hideHeading1Links ? "none" : null;

		// H2–H6
		for (const n of [2, 3, 4, 5, 6] as const) {
			const hn = `heading${n}` as const;
			this.assignEditorFontVars(vars, `--sf-h${n}`, s[`${hn}OverrideFont`], s[`${hn}FontFamily`], s[`${hn}FontWeight`]);
			vars[`--sf-h${n}-color`] = s[`${hn}OverrideColor`] ? s[`${hn}Color`] : null;
			vars[`--sf-h${n}-variant`] = s[`${hn}SmallCaps`] ? "small-caps" : null;
			vars[`--sf-h${n}-border-top`] = s[`${hn}DividerAbove`] ? `${HEADING_DIVIDER_WIDTH_PX[s[`${hn}DividerAboveThickness`]]}px solid var(--background-modifier-border)` : null;
			vars[`--sf-h${n}-border-bottom`] = s[`${hn}DividerBelow`] ? `${HEADING_DIVIDER_WIDTH_PX[s[`${hn}DividerBelowThickness`]]}px solid var(--background-modifier-border)` : null;
		}

		this.sfApi.setStyleVars(vars);

		// Register font faces into all documents
		for (const doc of this.sfApi.getStyleDocuments()) {
			registerCustomFontFaces(doc);
		}
	}

	private assignEditorFontVars(
		vars: Record<string, string | null>,
		prefix: string,
		overrideFont: boolean,
		familyId: string,
		fontWeight: string,
	): void {
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
		// Variable font: weight is encoded in variation-settings; CSS font-weight should stay normal.
		vars[`${prefix}-weight`] = variation != null ? null : fontWeight;
	}

	// ── storyForge connection ──────────────────────────────────────────────

	private connectToStoryForge(): void {
		const sfApi = getSfFormattingApi(this.app);
		if (!sfApi) {
			new Notice("formatForge: storyForge not found. Enable storyForge to activate formatting.");
			this.addSettingTab(new FormatForgeSettingsTab(this.app, this, null));
			this.addCommands(null);
			return;
		}

		this.sfApi = sfApi;

		this.unregisterCompanion = sfApi.registerCompanion({
			pluginId: "formatforge",
			version: 1,
			openSettings: () => {
				// Open the Obsidian settings modal to the formatForge tab
				const settingApp = (this.app as unknown as { setting?: { open(): void; openTabById(id: string): void } }).setting;
				settingApp?.open();
				settingApp?.openTabById("formatforge");
			},
			onHostStylesApplied: () => this.applyEditorStyles(),
			resolveFont: (familyId, weight) => {
				const font = CUSTOM_FONTS.find((f) => f.id === familyId);
				if (!font) return null;
				return resolveCustomFontFamilyParts(font, weight);
			},
			registerFacesForDocument: (doc) => registerCustomFontFaces(doc),
		});

		// Register faces into all currently open documents
		for (const doc of sfApi.getStyleDocuments()) {
			registerCustomFontFaces(doc);
		}

		// Apply editor styles immediately
		this.applyEditorStyles();

		// Register the view contribution stub (slot: "storyforge-panel")
		sfApi.registerViewContribution({
			slot: "storyforge-panel",
			orderHint: 50,
			render: (_containerEl) => {
				// Minimal stub — no panel contribution in this release
				return () => { /* no-op disposer */ };
			},
		});

		this.addSettingTab(new FormatForgeSettingsTab(this.app, this, sfApi));
		this.addCommands(sfApi);
	}

	// ── timelineForge connection ───────────────────────────────────────────

	private connectToTimelineForge(): void {
		const tryConnect = (): boolean => {
			if (this.unregisterTimelineCompanion) return true;
			const tfApi = getTfFormattingApi(this.app);
			if (!tfApi) return false;

			this.tfApi = tfApi;
			this.unregisterTimelineCompanion = tfApi.registerCompanion({
				pluginId: "formatforge",
				version: 1,
				resolveFont: (familyId, weight) => {
					const font = CUSTOM_FONTS.find((f) => f.id === familyId);
					if (!font) return null;
					return resolveCustomFontFamilyParts(font, weight);
				},
				registerFacesForDocument: (doc) => registerCustomFontFaces(doc),
				listFonts: () =>
					CUSTOM_FONTS.map((f) => ({
						id: f.id,
						label: f.label,
						weightMin: f.weightMin,
						weightMax: f.weightMax,
					})),
				openFontPicker: (opts) => {
					void import("./view/FontPickerModal").then(({ FontPickerModal }) => {
						new FontPickerModal(
							this.app,
							opts.currentFamilyId,
							opts.previewFontSizeEm,
							(id) => opts.onPick(id),
						).open();
					});
				},
				onHostStylesApplied: () => {
					registerCustomFontFaces(document);
				},
			});

			registerCustomFontFaces(document);
			return true;
		};

		if (tryConnect()) return;

		// timelineForge may finish loading after us — keep retrying for a while.
		let attempts = 0;
		const handle = window.setInterval(() => {
			attempts += 1;
			if (tryConnect() || attempts >= 120) {
				window.clearInterval(handle);
			}
		}, 500);
		this.registerInterval(handle);

		// Also retry when the workspace settles (plugin enable / layout).
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				tryConnect();
			}),
		);
	}

	private addCommands(sfApi: SfFormattingApi | null): void {
		this.addCommand({
			id: "open-text-style-modal",
			name: "Open text styling",
			callback: () => {
				void import("./view/TextStyleModal").then(({ TextStyleModal }) => {
					new TextStyleModal(this.app, this, sfApi).open();
				});
			},
		});

		this.addCommand({
			id: "open-ui-formatting-modal",
			name: "Open storyForge interface styles",
			callback: () => {
				void import("./view/UiFormattingModal").then(({ UiFormattingModal }) => {
					new UiFormattingModal(this.app, this, sfApi).open();
				});
			},
		});
	}

	// ── Persistence ───────────────────────────────────────────────────────

	private async loadSettings(): Promise<void> {
		const data = await this.loadData() as Partial<FormatForgeSettings> | null;
		this.ffSettings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.ffSettings);
	}
}
