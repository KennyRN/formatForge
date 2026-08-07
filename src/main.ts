import { Plugin } from "obsidian";
import type { PaletteName } from "./colorPalettes";
import {
	DEFAULT_SETTINGS,
	EDITOR_SCROLLBAR_WIDTH_PX,
	HEADING_DIVIDER_WIDTH_PX,
	type EditorScrollbarThickness,
	type FormatForgeSettings,
} from "./settings";
import { coerceSettings, isValidSettingValue } from "./settingsValidation";
import { softConnectWithRetry } from "./hostConnectRetry";
import {
	getSfFormattingApi,
	type SfFormattingApi,
	type SfLinkedFormattingKey,
	type SfPaletteColor,
	type SfPaletteName,
} from "./storyforgeBridge";
import { getTfFormattingApi, type TfFormattingApi } from "./timelineForgeBridge";
import { CUSTOM_FONTS, registerCustomFontFaces, resolveCustomFontFamilyParts } from "./fonts";
import { FormatForgeSettingsTab } from "./view/FormatForgeSettingsTab";
import type { FontCardHost } from "./view/styleModalHelpers";

export default class FormatForgePlugin extends Plugin implements FontCardHost {
	private ffSettings: FormatForgeSettings = { ...DEFAULT_SETTINGS };
	private sfApi: SfFormattingApi | null = null;
	private tfApi: TfFormattingApi | null = null;
	/** Identity of the last storyForge API object we registered against (hot-reload detect). */
	private storyForgeApiRef: SfFormattingApi | null = null;
	private timelineForgeApiRef: TfFormattingApi | null = null;
	private unregisterCompanion: (() => void) | null = null;
	private unregisterTimelineCompanion: (() => void) | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new FormatForgeSettingsTab(this.app, this));
		this.addCommands();
		// Same action as the "Open text styling" command — a one-click shortcut that skips
		// Settings entirely.
		this.addRibbonIcon("type", "Open text styling", () => {
			void import("./view/TextStyleModal").then(({ TextStyleModal }) => {
				new TextStyleModal(this.app, this, this.sfApi).open();
			});
		});

		// Soft-connect optional Forge hosts once the workspace is ready.
		this.app.workspace.onLayoutReady(() => {
			this.connectToStoryForge();
			this.connectToTimelineForge();
			this.applyEditorStyles();
		});
	}

	onunload(): void {
		// While connected, scrollbar inline styles were written onto storyForge's document
		// set (sfApi.getStyleDocuments()), which is not guaranteed to equal formatForge's
		// own pop-out enumeration (getLocalStyleDocuments()). Capture it before dropping
		// sfApi, same as the storyForge-side disconnect path, so formatForge unloading
		// while still linked doesn't leave stale scrollbar rules behind on a window it
		// didn't separately know about.
		let hostDocs: Document[] = [];
		try {
			hostDocs = this.sfApi?.getStyleDocuments() ?? [];
		} catch {
			hostDocs = [];
		}
		this.unregisterCompanion?.();
		this.unregisterCompanion = null;
		this.unregisterTimelineCompanion?.();
		this.unregisterTimelineCompanion = null;
		this.sfApi = null;
		this.tfApi = null;
		this.storyForgeApiRef = null;
		this.timelineForgeApiRef = null;
		this.clearEditorScrollbarStyles(hostDocs);
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

	/**
	 * Replace formatForge-owned Text styling settings from a versioned export section.
	 * Returns the keys that were rejected, so the caller can report a partial apply
	 * instead of a bad value reaching the CSS variables.
	 */
	async importTextStylingSettings(data: unknown): Promise<string[]> {
		if (!data || typeof data !== "object" || Array.isArray(data)) {
			throw new Error("Text styling settings must be a JSON object");
		}
		const incoming = data as Record<string, unknown>;
		// Same contract storyForge enforces on its linked keys: a bad value is dropped
		// rather than persisted.
		const { settings, rejected } = coerceSettings(this.ffSettings, incoming);
		const known = Object.keys(incoming).filter((key) =>
			Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key),
		);
		if (known.length > 0 && rejected.length === known.length) {
			throw new Error(
				`No usable text styling values (invalid: ${rejected.slice(0, 5).join(", ")})`,
			);
		}
		this.ffSettings = settings;
		await this.saveSettings();
		this.applyEditorStyles();
		return rejected;
	}

	// ── Typed settings access ──────────────────────────────────────────────

	getTypedSettings(): FormatForgeSettings {
		return this.ffSettings;
	}

	/**
	 * Writes a setting storyForge owns while twinned, and keeps formatForge's own copy in
	 * step. Sizes, palette and scrollbar exist on both sides: without the mirror, editing
	 * them while linked and then unlinking storyForge silently reverts to the last local
	 * value.
	 */
	async updateHostOwnedSetting(key: string, value: unknown): Promise<void> {
		if (this.sfApi) {
			await this.sfApi.updateLinkedSetting(key as SfLinkedFormattingKey, value);
			this.mirrorHostOwnedValues({ [key]: value });
			await this.saveSettings();
			return;
		}
		await this.updateSetting(key, value);
	}

	/**
	 * Copies host-owned values into `ffSettings` without saving (callers batch the save).
	 * `undefined` entries are skipped, and anything failing formatForge's own value
	 * contract is ignored rather than persisted.
	 */
	private mirrorHostOwnedValues(values: Record<string, unknown>): void {
		const target = this.ffSettings as unknown as Record<string, unknown>;
		for (const [key, value] of Object.entries(values)) {
			if (value === undefined) continue;
			if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) continue;
			if (!isValidSettingValue(key, value)) continue;
			target[key] = key === "customPaletteColors" && Array.isArray(value)
				? (value as SfPaletteColor[]).map((color) => ({ ...color }))
				: value;
		}
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

	/**
	 * Persist palette via storyForge when linked, otherwise to formatForge data.json.
	 * The local copy is kept in step either way so unlinking storyForge later does not
	 * revert to whatever palette data.json last held.
	 */
	async updatePalette(partial: {
		name?: SfPaletteName;
		variant?: string;
		customColors?: SfPaletteColor[];
	}): Promise<void> {
		if (this.sfApi) {
			await this.sfApi.updatePalette(partial);
			this.mirrorHostOwnedValues({
				colorPaletteName: partial.name,
				colorPaletteVariant: partial.variant,
				customPaletteColors: partial.customColors,
			});
			await this.saveSettings();
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
		vars["--sf-body-link-color-hover"] = s.bodyLinkOverrideColor ? s.bodyLinkHoverColor : null;
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
				void registerCustomFontFaces(doc);
			}
			this.applyStyleVarsToPreviews(vars);
			this.applyEditorScrollbarStyles();
			return;
		}

		this.applyStyleVarsLocally(vars);
		for (const doc of this.getLocalStyleDocuments()) {
			void registerCustomFontFaces(doc);
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
			this.mirrorHostOwnedValues({
				editorScrollbarThumbColor: partial.thumbColor,
				editorScrollbarThickness: partial.thickness,
			});
			await this.saveSettings();
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

	private clearEditorScrollbarStyles(extraDocs: Document[] = []): void {
		const docs = [...this.getLocalStyleDocuments(), ...extraDocs];
		const seen = new Set<Document>();
		const keys = [
			"--sf-editor-scrollbar-width",
			"--sf-editor-scrollbar-thumb",
			"--scrollbar-thumb-bg",
			"--scrollbar-active-thumb-bg",
			"--scrollbar-bg",
		];
		for (const doc of docs) {
			if (seen.has(doc)) continue;
			seen.add(doc);
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
			"-link-color-hover",
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

	/**
	 * storyForge is gone (unloaded, downgraded, or its API briefly unavailable). Invoke the
	 * disposers we still hold rather than abandoning them — a host that is still alive would
	 * otherwise keep believing a companion is registered — then snapshot the values storyForge
	 * owned and repaint. storyForge's `clearAll()` has just stripped every `--sf-*` variable,
	 * so without the repaint the editor loses all formatForge typography until a restart.
	 */
	private handleStoryForgeDisconnect(): void {
		const wasConnected = this.sfApi !== null || this.unregisterCompanion !== null;
		if (!wasConnected) {
			this.storyForgeApiRef = null;
			return;
		}
		this.snapshotHostOwnedSettings();
		let hostDocs: Document[] = [];
		try {
			hostDocs = this.sfApi?.getStyleDocuments() ?? [];
		} catch {
			hostDocs = [];
		}
		try {
			this.unregisterCompanion?.();
		} catch {
			/* host may already be dead */
		}
		this.unregisterCompanion = null;
		this.sfApi = null;
		this.storyForgeApiRef = null;
		// storyForge's clearAll only strips body --sf-* vars; our thumb/width rules also
		// land as inline styles on the manuscript scrollers and must be removed explicitly.
		this.clearEditorScrollbarStyles(hostDocs);
		this.applyEditorStyles();
	}

	/**
	 * Best-effort copy of the host-owned values into local settings before we let go of the
	 * API. This also catches edits the author made in storyForge's own UI, which never passed
	 * through `updateHostOwnedSetting`. A dead host may throw here; that is not fatal.
	 */
	private snapshotHostOwnedSettings(): void {
		const api = this.sfApi;
		if (!api) return;
		try {
			const linked = api.getLinkedSettings() as Record<string, unknown>;
			this.mirrorHostOwnedValues(linked);
			void this.saveSettings();
		} catch {
			/* host already torn down — keep the last known local values */
		}
	}

	private connectToStoryForge(): void {
		const tryConnect = (): boolean => {
			const sfApi = getSfFormattingApi(this.app);
			if (!sfApi) {
				this.handleStoryForgeDisconnect();
				return false;
			}

			// Already bound to this host instance — leave styles alone.
			if (this.unregisterCompanion && this.storyForgeApiRef === sfApi) {
				return true;
			}

			// Host hot-reloaded (or first connect): drop the stale disposer and rebind.
			try {
				this.unregisterCompanion?.();
			} catch {
				/* old host may already be dead */
			}

			this.sfApi = sfApi;
			this.storyForgeApiRef = sfApi;

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
				registerFacesForDocument: (doc) => {
					void registerCustomFontFaces(doc);
				},
			});

			for (const doc of sfApi.getStyleDocuments()) {
				void registerCustomFontFaces(doc);
			}

			// Re-apply after host clearAll()+reload wiped --sf-* editor vars.
			this.applyEditorStyles();
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
			const tfApi = getTfFormattingApi(this.app);
			if (!tfApi) {
				this.unregisterTimelineCompanion = null;
				this.tfApi = null;
				this.timelineForgeApiRef = null;
				return false;
			}

			if (this.unregisterTimelineCompanion && this.timelineForgeApiRef === tfApi) {
				return true;
			}

			try {
				this.unregisterTimelineCompanion?.();
			} catch {
				/* old host may already be dead */
			}

			this.tfApi = tfApi;
			this.timelineForgeApiRef = tfApi;
			this.unregisterTimelineCompanion = tfApi.registerCompanion({
				pluginId: "formatforge",
				version: 1,
				resolveFont: (familyId, weight) => {
					const font = CUSTOM_FONTS.find((f) => f.id === familyId);
					if (!font) return null;
					return resolveCustomFontFamilyParts(font, weight);
				},
				registerFacesForDocument: (doc) => {
					void registerCustomFontFaces(doc);
				},
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
					void registerCustomFontFaces(document);
				},
			});

			void registerCustomFontFaces(document);
			return true;
		};

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
		const data: Partial<FormatForgeSettings> | null = await this.loadData();
		// A hand-edited or downgraded data.json must not be able to feed a bad enum into
		// the CSS variable maps; rejected values fall back to the defaults.
		const { settings, rejected } = coerceSettings(
			{ ...DEFAULT_SETTINGS, customPaletteColors: DEFAULT_SETTINGS.customPaletteColors.map((c) => ({ ...c })) },
			data ?? {},
		);
		this.ffSettings = settings;
		if (rejected.length > 0) {
			console.warn(
				`formatForge: ignored ${rejected.length} invalid saved setting(s): ${rejected.join(", ")}`,
			);
		}
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.ffSettings);
	}
}
