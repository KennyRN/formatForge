import { Plugin } from "obsidian";
import type { PaletteName } from "./colorPalettes";
import {
	DEFAULT_SETTINGS,
	EDITOR_SCROLLBAR_WIDTH_PX,
	HEADING_DIVIDER_WIDTH_PX,
	type EditorScrollbarThickness,
	type FormatForgeSettings,
} from "./settings";
import { softConnectWithRetry } from "./hostConnectRetry";
import { getSfFormattingApi, type SfFormattingApi, type SfPaletteColor, type SfPaletteName } from "./storyforgeBridge";
import { getTfFormattingApi, type TfFormattingApi } from "./timelineForgeBridge";
import { CUSTOM_FONTS, registerCustomFontFaces, resolveCustomFontFamilyParts, setFontPluginDir } from "./fonts";
import { FormatForgeSettingsTab } from "./view/FormatForgeSettingsTab";
import type { FontCardHost } from "./view/styleModalHelpers";

export default class FormatForgePlugin extends Plugin implements FontCardHost {
	private ffSettings: FormatForgeSettings = { ...DEFAULT_SETTINGS };
	private sfApi: SfFormattingApi | null = null;
	private tfApi: TfFormattingApi | null = null;
	private unregisterCompanion: (() => void) | null = null;
	private unregisterTimelineCompanion: (() => void) | null = null;

	async onload(): Promise<void> {
		setFontPluginDir(this.manifest.dir);
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
		this.clearEditorScrollbarStyles();
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

	/** Palette from storyForge when available, otherwise formatForge's own settings. */
	getPalette(): { name: SfPaletteName; variant: string; customColors: SfPaletteColor[] } {
		if (this.sfApi) return this.sfApi.getPalette();
		return {
			name: this.ffSettings.colorPaletteName,
			variant: this.ffSettings.colorPaletteVariant,
			customColors: this.ffSettings.customPaletteColors,
		};
	}

	/** Persist palette via storyForge when linked, otherwise to formatForge data.json. */
	async updatePalette(partial: {
		name?: SfPaletteName;
		variant?: string;
		customColors?: SfPaletteColor[];
	}): Promise<void> {
		if (this.sfApi) {
			await this.sfApi.updatePalette(partial);
			return;
		}
		if (partial.name !== undefined) {
			this.ffSettings.colorPaletteName = partial.name as PaletteName;
		}
		if (partial.variant !== undefined) {
			this.ffSettings.colorPaletteVariant = partial.variant;
		}
		if (partial.customColors !== undefined) {
			this.ffSettings.customPaletteColors = partial.customColors;
		}
		await this.saveSettings();
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
		vars["--sf-body-link-color"] = s.bodyLinkOverrideColor ? s.bodyLinkColor : null;
		vars["--sf-body-link-decoration"] = s.bodyLinkRemoveUnderline ? "none" : null;
		vars["--sf-body-highlight-bg"] = s.bodyHighlightOverride ? s.bodyHighlightBgColor : null;
		vars["--sf-body-highlight-color"] = s.bodyHighlightOverride ? s.bodyHighlightTextColor : null;

		// Sizes: storyForge linked settings when present, otherwise formatForge's own.
		if (this.sfApi) {
			const linked = this.sfApi.getLinkedSettings();
			vars["--sf-body-size"] = linked.bodyTextOverrideSize ? `${linked.bodyTextSize as number}em` : null;
			for (const n of [1, 2, 3, 4, 5, 6] as const) {
				const override = linked[`heading${n}OverrideSize` as const];
				const size = linked[`heading${n}Size` as const];
				vars[`--sf-h${n}-size`] = override ? `${size as number}em` : null;
			}
		} else {
			vars["--sf-body-size"] = s.bodyTextOverrideSize ? `${s.bodyTextSize}em` : null;
			for (const n of [1, 2, 3, 4, 5, 6] as const) {
				const override = s[`heading${n}OverrideSize`];
				const size = s[`heading${n}Size`];
				vars[`--sf-h${n}-size`] = override ? `${size}em` : null;
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
			this.applyStyleVarsToPreviews(vars);
			this.applyEditorScrollbarStyles();
			return;
		}

		this.applyStyleVarsLocally(vars);
		for (const doc of this.getLocalStyleDocuments()) {
			registerCustomFontFaces(doc);
		}
		this.applyStyleVarsToPreviews(vars);
		this.applyEditorScrollbarStyles();
	}

	/**
	 * Pin editor CSS vars on each live-preview scroller so typography does not depend on
	 * inheriting through Obsidian modal chrome (which can reset/override fonts).
	 */
	private applyStyleVarsToPreviews(vars: Record<string, string | null>): void {
		const docs = this.sfApi ? this.sfApi.getStyleDocuments() : this.getLocalStyleDocuments();
		for (const doc of docs) {
			for (const preview of Array.from(doc.querySelectorAll(".ff-style-preview"))) {
				const style = (preview as HTMLElement).style;
				for (const [key, value] of Object.entries(vars)) {
					if (value == null || value === "") style.removeProperty(key);
					else style.setProperty(key, value);
				}
			}
		}
	}

	/** Resolve scrollbar settings from storyForge when linked, else local defaults. */
	getEditorScrollbar(): {
		thumbColor: string;
		thickness: EditorScrollbarThickness;
	} {
		if (this.sfApi) {
			const linked = this.sfApi.getLinkedSettings();
			const thickness = linked.editorScrollbarThickness;
			return {
				thumbColor: String(linked.editorScrollbarThumbColor ?? DEFAULT_SETTINGS.editorScrollbarThumbColor),
				thickness: thickness === "thin" || thickness === "medium" || thickness === "thick"
					? thickness
					: DEFAULT_SETTINGS.editorScrollbarThickness,
			};
		}
		return {
			thumbColor: this.ffSettings.editorScrollbarThumbColor,
			thickness: this.ffSettings.editorScrollbarThickness,
		};
	}

	async updateEditorScrollbar(partial: {
		thumbColor?: string;
		thickness?: EditorScrollbarThickness;
	}): Promise<void> {
		if (this.sfApi) {
			if (partial.thumbColor !== undefined) {
				await this.sfApi.updateLinkedSetting("editorScrollbarThumbColor", partial.thumbColor);
			}
			if (partial.thickness !== undefined) {
				await this.sfApi.updateLinkedSetting("editorScrollbarThickness", partial.thickness);
			}
			this.applyEditorScrollbarStyles();
			return;
		}
		if (partial.thumbColor !== undefined) this.ffSettings.editorScrollbarThumbColor = partial.thumbColor;
		if (partial.thickness !== undefined) this.ffSettings.editorScrollbarThickness = partial.thickness;
		await this.saveSettings();
		this.applyEditorScrollbarStyles();
	}

	/** Manuscript editor scrollbar thumb colour and width. */
	applyEditorScrollbarStyles(): void {
		const { thumbColor, thickness } = this.getEditorScrollbar();
		const width = EDITOR_SCROLLBAR_WIDTH_PX[thickness];
		// Editor: transparent at rest (Obsidian --scrollbar-thumb-bg), colour on hover.
		// Preview: always show the chosen colour so Extras picks are visible.
		const editorVars: Record<string, string | null> = {
			"--sf-editor-scrollbar-width": `${width}px`,
			"--sf-editor-scrollbar-thumb": thumbColor,
			"--scrollbar-thumb-bg": "transparent",
			"--scrollbar-active-thumb-bg": thumbColor,
			"--scrollbar-bg": "transparent",
		};
		const previewVars: Record<string, string | null> = {
			"--sf-editor-scrollbar-width": `${width}px`,
			"--sf-editor-scrollbar-thumb": thumbColor,
			"--scrollbar-thumb-bg": thumbColor,
			"--scrollbar-active-thumb-bg": thumbColor,
			"--scrollbar-bg": "transparent",
		};

		const applyVars = (el: HTMLElement, vars: Record<string, string | null>) => {
			for (const [key, value] of Object.entries(vars)) {
				if (value == null || value === "") el.style.removeProperty(key);
				else el.style.setProperty(key, value);
			}
		};

		const docs = this.sfApi ? this.sfApi.getStyleDocuments() : this.getLocalStyleDocuments();
		for (const doc of docs) {
			applyVars(doc.body, editorVars);
			this.applyEditorScrollbarBodyClass(doc.body, thickness);

			for (const node of doc.querySelectorAll(".markdown-source-view .cm-scroller, .markdown-preview-view")) {
				applyVars(node as HTMLElement, editorVars);
			}
			for (const node of doc.querySelectorAll(".ff-style-preview")) {
				const el = node as HTMLElement;
				applyVars(el, previewVars);
				this.syncPreviewScrollbarClasses(el, thickness);
			}
		}
	}

	/** Thickness classes on the live-preview scroller (plan: preview-scoped, not body-only). */
	syncPreviewScrollbarClasses(preview: HTMLElement, thickness?: EditorScrollbarThickness): void {
		const resolved = thickness ?? this.getEditorScrollbar().thickness;
		preview.classList.add("sf-editor-scrollbar");
		preview.classList.remove("sf-sb-thin", "sf-sb-medium", "sf-sb-thick");
		preview.classList.add(`sf-sb-${resolved}`);
	}

	private applyEditorScrollbarBodyClass(body: HTMLElement, thickness: EditorScrollbarThickness): void {
		body.classList.add("sf-editor-scrollbar");
		body.classList.remove("sf-sb-thin", "sf-sb-medium", "sf-sb-thick");
		body.classList.add(`sf-sb-${thickness}`);
	}

	private clearEditorScrollbarStyles(): void {
		const docs = this.getLocalStyleDocuments();
		const keys = [
			"--sf-editor-scrollbar-width",
			"--sf-editor-scrollbar-thumb",
			"--scrollbar-thumb-bg",
			"--scrollbar-active-thumb-bg",
			"--scrollbar-bg",
		];
		for (const doc of docs) {
			const { style } = doc.body;
			for (const key of keys) style.removeProperty(key);
			doc.body.classList.remove("sf-editor-scrollbar", "sf-sb-thin", "sf-sb-medium", "sf-sb-thick");
			for (const node of doc.querySelectorAll(".ff-style-preview, .markdown-source-view .cm-scroller, .markdown-preview-view")) {
				const el = node as HTMLElement;
				for (const key of keys) el.style.removeProperty(key);
				el.classList.remove("sf-editor-scrollbar", "sf-sb-thin", "sf-sb-medium", "sf-sb-thick");
			}
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
			"-highlight-bg",
			"-highlight-color",
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
		const tryConnect = (): boolean => {
			if (this.unregisterCompanion) return true;
			const sfApi = getSfFormattingApi(this.app);
			if (!sfApi) return false;

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
			return true;
		};

		softConnectWithRetry(tryConnect, {
			registerInterval: (id) => this.registerInterval(id),
			onLayoutChange: (cb) => {
				this.registerEvent(this.app.workspace.on("layout-change", cb));
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

		// timelineForge may finish loading after us — keep retrying for a while.
		softConnectWithRetry(tryConnect, {
			registerInterval: (id) => this.registerInterval(id),
			onLayoutChange: (cb) => {
				this.registerEvent(this.app.workspace.on("layout-change", cb));
			},
		});
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
			name: "Open storyForge interface styles",
			callback: () => {
				void import("./view/UiFormattingModal").then(({ UiFormattingModal }) => {
					new UiFormattingModal(this.app, this, this.sfApi).open();
				});
			},
		});
	}

	// ── Persistence ───────────────────────────────────────────────────────

	private async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<FormatForgeSettings> | null;
		const customColors =
			data?.customPaletteColors ?? DEFAULT_SETTINGS.customPaletteColors;
		this.ffSettings = {
			...DEFAULT_SETTINGS,
			...(data ?? {}),
			customPaletteColors: customColors.map((c) => ({ ...c })),
		};
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.ffSettings);
	}
}
