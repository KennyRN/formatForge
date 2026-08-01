import { Plugin } from "obsidian";
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

		this.addSettingTab(new FormatForgeSettingsTab(this.app, this));
		this.addCommands();

		// Soft-connect optional Forge hosts once the workspace is ready.
		this.app.workspace.onLayoutReady(() => {
			this.connectToStoryForge();
			this.connectToTimelineForge();
			this.applyEditorStyles();
		});
	}

	onunload(): void {
		this.unregisterCompanion?.();
		this.unregisterCompanion = null;
		this.unregisterTimelineCompanion?.();
		this.unregisterTimelineCompanion = null;
		this.sfApi = null;
		this.tfApi = null;
		this.clearLocalStyleVars();
	}

	/** storyForge formatting API when that host is available. */
	getStoryForgeApi(): SfFormattingApi | null {
		return this.sfApi;
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

	/** Palette from storyForge when available, otherwise a local Custom fallback. */
	getPalette(): { name: SfPaletteName; variant: string; customColors: SfPaletteColor[] } {
		if (this.sfApi) return this.sfApi.getPalette();
		return { name: "Custom", variant: "", customColors: [] };
	}

	// ── Editor style application ───────────────────────────────────────────

	applyEditorStyles(): void {
		const s = this.ffSettings;
		const vars: Record<string, string | null> = {};

		// Body text
		this.assignEditorFontVars(vars, "--sf-body", s.bodyTextOverrideFont, s.bodyTextFontFamily, s.bodyTextFontWeight);
		vars["--sf-body-color"] = s.bodyTextOverrideColor ? s.bodyTextColor : null;
		vars["--sf-body-bold-color"] = s.bodyTextOverrideEmphasisColor ? s.bodyTextBoldColor : null;
		vars["--sf-body-italic-color"] = s.bodyTextOverrideEmphasisColor ? s.bodyTextItalicColor : null;

		// Sizes stay storyForge-linked when that host is present.
		if (this.sfApi) {
			const linked = this.sfApi.getLinkedSettings();
			vars["--sf-body-size"] = linked.bodyTextOverrideSize ? `${linked.bodyTextSize as number}em` : null;
			for (const n of [1, 2, 3, 4, 5, 6] as const) {
				const override = linked[`heading${n}OverrideSize` as const];
				const size = linked[`heading${n}Size` as const];
				vars[`--sf-h${n}-size`] = override ? `${size as number}em` : null;
			}
		}

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

		if (this.sfApi) {
			this.sfApi.setStyleVars(vars);
			for (const doc of this.sfApi.getStyleDocuments()) {
				registerCustomFontFaces(doc);
			}
			return;
		}

		this.applyStyleVarsLocally(vars);
		for (const doc of this.getLocalStyleDocuments()) {
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

	private getLocalStyleDocuments(): Document[] {
		const docs: Document[] = [document];
		const workspace = this.app.workspace as unknown as {
			getLayout?: () => unknown;
			floatingSplit?: { children?: Array<{ win?: Window }> };
		};
		const floating = workspace.floatingSplit?.children ?? [];
		for (const child of floating) {
			const doc = child.win?.document;
			if (doc && !docs.includes(doc)) docs.push(doc);
		}
		return docs;
	}

	private applyStyleVarsLocally(vars: Record<string, string | null>): void {
		for (const doc of this.getLocalStyleDocuments()) {
			const { style } = doc.body;
			for (const [key, value] of Object.entries(vars)) {
				if (value == null || value === "") style.removeProperty(key);
				else style.setProperty(key, value);
			}
		}
	}

	private clearLocalStyleVars(): void {
		const prefixes = ["--sf-body", "--sf-h1", "--sf-h2", "--sf-h3", "--sf-h4", "--sf-h5", "--sf-h6"];
		const suffixes = [
			"",
			"-size",
			"-color",
			"-bold-color",
			"-italic-color",
			"-family",
			"-variation",
			"-weight",
			"-variant",
			"-border-top",
			"-border-bottom",
			"-link-color",
			"-link-decoration",
		];
		for (const doc of this.getLocalStyleDocuments()) {
			const { style } = doc.body;
			for (const prefix of prefixes) {
				for (const suffix of suffixes) {
					style.removeProperty(`${prefix}${suffix}`);
				}
			}
		}
	}

	// ── storyForge connection (optional) ───────────────────────────────────

	private connectToStoryForge(): void {
		const sfApi = getSfFormattingApi(this.app);
		if (!sfApi) return;

		this.sfApi = sfApi;

		this.unregisterCompanion = sfApi.registerCompanion({
			pluginId: "formatforge",
			version: 1,
			openSettings: () => {
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

		for (const doc of sfApi.getStyleDocuments()) {
			registerCustomFontFaces(doc);
		}

		this.applyEditorStyles();

		sfApi.registerViewContribution({
			slot: "storyforge-panel",
			orderHint: 50,
			render: (_containerEl) => {
				return () => { /* no-op disposer */ };
			},
		});
	}

	// ── timelineForge connection (optional) ────────────────────────────────

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

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				tryConnect();
			}),
		);
	}

	private addCommands(): void {
		this.addCommand({
			id: "open-text-style-modal",
			name: "Open text styling",
			callback: () => {
				void import("./view/TextStyleModal").then(({ TextStyleModal }) => {
					new TextStyleModal(this.app, this, this.sfApi).open();
				});
			},
		});

		this.addCommand({
			id: "open-ui-formatting-modal",
			name: "Open Forge interface styles",
			callback: () => {
				void import("./view/UiFormattingModal").then(({ UiFormattingModal }) => {
					new UiFormattingModal(this.app, this, this.sfApi).open();
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
