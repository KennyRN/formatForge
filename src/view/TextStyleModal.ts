import { App, Modal, Setting, SettingGroup, ToggleComponent } from "obsidian";
import type FormatForgePlugin from "../main";
import { registerCustomFontFaces } from "../fonts";
import type { FormatForgeSettings } from "../settings";
import type { SfFormattingApi } from "../storyforgeBridge";
import {
	bindColorSwatchButton,
	renderCustomFontCard,
	renderTabbedBody,
	renderToggleWithRevealCard,
	wireCardToggle,
	type StyleModalTab,
} from "./styleModalHelpers";
import { mountStylePreviewSample } from "./stylePreviewSample";

const EDITOR_SCROLLBAR_THICKNESS_ORDER = ["thin", "medium", "thick"] as const;
const EDITOR_SCROLLBAR_THICKNESS_LABELS = ["Thin", "Medium", "Thick"];

type LinkedSizeOverrideKey =
	| "bodyTextOverrideSize"
	| "heading1OverrideSize"
	| "heading2OverrideSize"
	| "heading3OverrideSize"
	| "heading4OverrideSize"
	| "heading5OverrideSize"
	| "heading6OverrideSize";

type LinkedSizeKey =
	| "bodyTextSize"
	| "heading1Size"
	| "heading2Size"
	| "heading3Size"
	| "heading4Size"
	| "heading5Size"
	| "heading6Size";

type LocalSizeOverrideKey = "codeOverrideSize" | "blockquoteOverrideSize";

type LocalSizeKey = "codeSize" | "blockquoteSize";

type EditorSizeOverrideKey = LinkedSizeOverrideKey | LocalSizeOverrideKey;
type EditorSizeKey = LinkedSizeKey | LocalSizeKey;

const LINKED_SIZE_OVERRIDE_KEYS: readonly LinkedSizeOverrideKey[] = [
	"bodyTextOverrideSize",
	"heading1OverrideSize",
	"heading2OverrideSize",
	"heading3OverrideSize",
	"heading4OverrideSize",
	"heading5OverrideSize",
	"heading6OverrideSize",
];

const LINKED_SIZE_KEYS: readonly LinkedSizeKey[] = [
	"bodyTextSize",
	"heading1Size",
	"heading2Size",
	"heading3Size",
	"heading4Size",
	"heading5Size",
	"heading6Size",
];

function isLinkedSizeOverride(key: string): key is LinkedSizeOverrideKey {
	return (LINKED_SIZE_OVERRIDE_KEYS as readonly string[]).includes(key);
}

function isLinkedSize(key: string): key is LinkedSizeKey {
	return (LINKED_SIZE_KEYS as readonly string[]).includes(key);
}

export class TextStyleModal extends Modal {
	private plugin: FormatForgePlugin;
	private sfApi: SfFormattingApi | null;
	private selectedOtherHeadingLevel: 4 | 5 | 6 = 4;
	private selectedBodyRegion = "text";

	constructor(app: App, plugin: FormatForgePlugin, sfApi: SfFormattingApi | null) {
		super(app);
		this.plugin = plugin;
		this.sfApi = sfApi;
	}

	onOpen(): void {
		this.modalEl.addClass("sf-text-style-modal");
		this.titleEl.remove();
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("sf-text-style-modal");

		const settings = this.plugin.getTypedSettings();
		const restyle = () => this.plugin.applyEditorStyles();
		// Always prefer the live API so a disconnect mid-session switches size writes to local.
		const sfApi = this.plugin.getStoryForgeApi();
		this.sfApi = sfApi;

		const layout = contentEl.createDiv({ cls: "ff-text-style-layout" });
		const controls = layout.createDiv({ cls: "ff-text-style-controls" });
		const previewPane = layout.createDiv({ cls: "ff-style-preview-pane" });
		previewPane.createDiv({ cls: "ff-style-preview-label", text: "Preview" });
		const preview = previewPane.createDiv({ cls: "ff-style-preview" });

		// Cycling guide is deliberately left out of this preview — storyForge's own settings modal
		// has its own dedicated cycling-guide preview now, so showing it here too was redundant.
		const remountPreview = () => {
			mountStylePreviewSample(preview);
			this.plugin.applyEditorScrollbarStyles();
			void registerCustomFontFaces(document).then(() => this.plugin.applyEditorStyles());
		};
		remountPreview();

		const tabs: StyleModalTab[] = [
			{
				id: "body",
				label: "Body",
				render: (body) => {
					renderTabbedBody(
						body,
						[
							{
								id: "text",
								label: "Text",
								render: (tab) => this.renderBodyTextTab(tab, settings, restyle),
							},
							{
								id: "quote",
								label: "Quote",
								render: (tab) => this.renderBodyQuoteTab(tab, settings, restyle),
							},
							{
								id: "links",
								label: "Links and lists",
								render: (tab) => this.renderBodyLinksAndListsTab(tab, settings, restyle),
							},
						],
						{
							initialId: this.selectedBodyRegion,
							onActivate: (id) => {
								this.selectedBodyRegion = id;
							},
						},
					);
				},
			},
			{
				id: "h1",
				label: "H1",
				render: (body) => {
					this.renderSizeCard(
						body,
						"Override theme's default header size",
						"Header size",
						"heading1OverrideSize",
						"heading1Size",
						1,
						2.5,
						restyle,
						{
							extraRowBefore: (card) =>
								card.addSetting((setting) => {
									setting
										.setName("Hide Heading 1 Links")
										.setDesc(
											"When on, links inside a note's H1 heading render as plain text — no link colour or underline — so the title looks like a normal heading.",
										)
										.addToggle((toggle) =>
											toggle.setValue(settings.hideHeading1Links).onChange((value) => {
												void this.plugin.updateSetting("hideHeading1Links", value).then(() => restyle());
											}),
										);
								}),
						},
					);
					this.renderColorOverrideCard(body, settings, "Header colour", "heading1OverrideColor", "heading1Color", restyle);
					this.renderFontCard(
						body,
						settings,
						"heading1OverrideFont",
						"heading1FontWeight",
						"heading1FontFamily",
						"heading1SmallCaps",
						this.regionPreviewSizeEm("heading1OverrideSize", "heading1Size"),
					);
					this.renderDividerCard(body, settings, "heading1DividerAbove", "heading1DividerAboveThickness", "heading1DividerBelow", "heading1DividerBelowThickness", restyle);
				},
			},
			{
				id: "h2",
				label: "H2",
				render: (body) => {
					this.renderSizeCard(body, "Override theme's default header size", "Header size", "heading2OverrideSize", "heading2Size", 1, 2.5, restyle);
					this.renderColorOverrideCard(body, settings, "Header colour", "heading2OverrideColor", "heading2Color", restyle);
					this.renderFontCard(
						body,
						settings,
						"heading2OverrideFont",
						"heading2FontWeight",
						"heading2FontFamily",
						"heading2SmallCaps",
						this.regionPreviewSizeEm("heading2OverrideSize", "heading2Size"),
					);
					this.renderDividerCard(body, settings, "heading2DividerAbove", "heading2DividerAboveThickness", "heading2DividerBelow", "heading2DividerBelowThickness", restyle);
				},
			},
			{
				id: "h3",
				label: "H3",
				render: (body) => {
					this.renderSizeCard(body, "Override theme's default header size", "Header size", "heading3OverrideSize", "heading3Size", 1, 2.5, restyle);
					this.renderColorOverrideCard(body, settings, "Header colour", "heading3OverrideColor", "heading3Color", restyle);
					this.renderFontCard(
						body,
						settings,
						"heading3OverrideFont",
						"heading3FontWeight",
						"heading3FontFamily",
						"heading3SmallCaps",
						this.regionPreviewSizeEm("heading3OverrideSize", "heading3Size"),
					);
					this.renderDividerCard(body, settings, "heading3DividerAbove", "heading3DividerAboveThickness", "heading3DividerBelow", "heading3DividerBelowThickness", restyle);
				},
			},
			{
				id: "other",
				label: "H4–6",
				render: (body) => {
					renderTabbedBody(
						body,
						([4, 5, 6] as const).map((n) => ({
							id: `h${n}`,
							label: `H${n}`,
							render: (levelBody) => this.renderOtherHeadingLevel(levelBody, n, settings, restyle),
						})),
						{
							initialId: `h${this.selectedOtherHeadingLevel}`,
							onActivate: (id) => {
								this.selectedOtherHeadingLevel = Number(id.slice(1)) as 4 | 5 | 6;
							},
						},
					);
				},
			},
			{
				id: "extras",
				label: "Extras",
				render: (body) => {
					this.renderEditorScrollbarGroup(body);
				},
			},
		];

		renderTabbedBody(controls, tabs);
	}

	private renderBodyTextTab(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		this.renderTypographyCard(body, settings, restyle, {
			overrideFont: "bodyTextOverrideFont",
			fontWeight: "bodyTextFontWeight",
			fontFamily: "bodyTextFontFamily",
			overrideSize: "bodyTextOverrideSize",
			size: "bodyTextSize",
			overrideColor: "bodyTextOverrideColor",
			color: "bodyTextColor",
			pickFontName: "Font",
		});
		this.renderEmphasisColorOverrideCard(body, settings, restyle);
		this.renderHighlightColorOverrideCard(body, settings, restyle);
		this.renderTypographyCard(body, settings, restyle, {
			overrideFont: "codeOverrideFont",
			fontWeight: "codeFontWeight",
			fontFamily: "codeFontFamily",
			overrideSize: "codeOverrideSize",
			size: "codeSize",
			overrideColor: "codeOverrideColor",
			color: "codeColor",
			pickFontName: "Code font",
			themeDefaultPreviewFamily: "var(--font-monospace)",
			extraColors: [{ label: "Background", overrideKey: "codeOverrideBg", colorKey: "codeBgColor" }],
		});
	}

	private renderBodyQuoteTab(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		this.renderTypographyCard(body, settings, restyle, {
			overrideFont: "blockquoteOverrideFont",
			fontWeight: "blockquoteFontWeight",
			fontFamily: "blockquoteFontFamily",
			overrideSize: "blockquoteOverrideSize",
			size: "blockquoteSize",
			overrideColor: "blockquoteOverrideColor",
			color: "blockquoteColor",
			pickFontName: "Font",
			extraColors: [
				{ label: "Background", overrideKey: "blockquoteOverrideBg", colorKey: "blockquoteBgColor" },
				{ label: "Side indicator", overrideKey: "blockquoteOverrideBorder", colorKey: "blockquoteBorderColor" },
			],
		});
	}

	private renderBodyLinksAndListsTab(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		this.renderLinkStyleCard(body, settings, restyle);
		const markers = new SettingGroup(body);
		this.renderColorOverrideCard(
			body,
			settings,
			"Ordered list marker",
			"orderedListOverrideColor",
			"orderedListColor",
			restyle,
			markers,
		);
		this.renderColorOverrideCard(
			body,
			settings,
			"Unordered list marker",
			"unorderedListOverrideColor",
			"unorderedListColor",
			restyle,
			markers,
		);
	}

	private renderTypographyCard(
		body: HTMLElement,
		settings: FormatForgeSettings,
		restyle: () => void,
		keys: {
			overrideFont: keyof FormatForgeSettings;
			fontWeight: keyof FormatForgeSettings;
			fontFamily: keyof FormatForgeSettings;
			overrideSize: EditorSizeOverrideKey;
			size: EditorSizeKey;
			overrideColor: keyof FormatForgeSettings;
			color: keyof FormatForgeSettings;
			pickFontName?: string;
			themeDefaultPreviewFamily?: string;
			extraColors?: Array<{
				label: string;
				overrideKey: keyof FormatForgeSettings;
				colorKey: keyof FormatForgeSettings;
			}>;
		},
	): SettingGroup {
		const fontCard = this.renderFontCard(
			body,
			settings,
			keys.overrideFont,
			keys.fontWeight,
			keys.fontFamily,
			undefined,
			this.regionPreviewSizeEm(keys.overrideSize, keys.size),
			keys.pickFontName,
			keys.themeDefaultPreviewFamily,
		);
		this.renderSizeCard(
			body,
			"Override theme's default font size",
			"Font size",
			keys.overrideSize,
			keys.size,
			0.7,
			1.8,
			restyle,
			{ group: fontCard },
		);
		this.renderColorOverrideCard(body, settings, "Font colour", keys.overrideColor, keys.color, restyle, fontCard);
		for (const extra of keys.extraColors ?? []) {
			this.renderColorOverrideCard(body, settings, extra.label, extra.overrideKey, extra.colorKey, restyle, fontCard);
		}
		return fontCard;
	}

	private renderEditorScrollbarGroup(body: HTMLElement): void {
		const group = new SettingGroup(body);
		const scrollbar = this.plugin.getEditorScrollbar();

		group.addSetting((setting) => {
			setting
				.setName("Scrollbar")
				.setDesc("Colour of the scrollbar thumb. Shown in the preview; in the editor it appears on hover.")
				.addButton((button) =>
					bindColorSwatchButton(
						this.app,
						() => this.plugin.getPalette(),
						button.buttonEl,
						scrollbar.thumbColor,
						(hex) => {
							void this.plugin.updateEditorScrollbar({ thumbColor: hex });
						},
					),
				);
		});

		const thicknessIdx = Math.max(0, EDITOR_SCROLLBAR_THICKNESS_ORDER.indexOf(scrollbar.thickness));
		group.addSetting((setting) => {
			setting
				.setName("Thickness")
				.setDesc(`${EDITOR_SCROLLBAR_THICKNESS_LABELS[thicknessIdx]} — thin · medium · thick.`)
				.addSlider((slider) =>
					slider
						.setLimits(0, 2, 1)
						.setValue(thicknessIdx)
						.setDisplayFormat((value) => EDITOR_SCROLLBAR_THICKNESS_LABELS[Math.round(value)] ?? "Thick")
						.onChange((value) => {
							const idx = Math.round(value);
							const thickness = EDITOR_SCROLLBAR_THICKNESS_ORDER[idx] ?? "thick";
							setting.setDesc(`${EDITOR_SCROLLBAR_THICKNESS_LABELS[idx] ?? "Thick"} — thin · medium · thick.`);
							void this.plugin.updateEditorScrollbar({ thickness });
						}),
				);
		});
	}

	private renderOtherHeadingLevel(
		body: HTMLElement,
		n: 4 | 5 | 6,
		settings: FormatForgeSettings,
		restyle: () => void,
	): void {
		const sizeKey = `heading${n}Size` as EditorSizeKey;
		const overrideSizeKey = `heading${n}OverrideSize` as EditorSizeOverrideKey;
		this.renderSizeCard(body, "Override theme's default header size", "Header size", overrideSizeKey, sizeKey, 0.7, 1.8, restyle);
		this.renderColorOverrideCard(body, settings, "Header colour", `heading${n}OverrideColor`, `heading${n}Color`, restyle);
		this.renderFontCard(
			body,
			settings,
			`heading${n}OverrideFont`,
			`heading${n}FontWeight`,
			`heading${n}FontFamily`,
			`heading${n}SmallCaps`,
			this.regionPreviewSizeEm(`heading${n}OverrideSize`, `heading${n}Size`),
		);
		this.renderDividerCard(
			body,
			settings,
			`heading${n}DividerAbove`,
			`heading${n}DividerAboveThickness`,
			`heading${n}DividerBelow`,
			`heading${n}DividerBelowThickness`,
			restyle,
		);
	}

	/**
	 * Size cards write to storyForge linked settings when that host is available,
	 * otherwise to formatForge's own settings.
	 */
	private renderSizeCard(
		body: HTMLElement,
		label: string,
		sliderLabel: string,
		overrideKey: EditorSizeOverrideKey,
		sizeKey: EditorSizeKey,
		min: number,
		max: number,
		restyle: () => void,
		opts?: { extraRowBefore?: (card: SettingGroup) => void; group?: SettingGroup },
	): void {
		const settings = this.plugin.getTypedSettings();
		let initialOverride: boolean;
		let initialSize: number;
		if (this.sfApi && isLinkedSizeOverride(overrideKey) && isLinkedSize(sizeKey)) {
			initialOverride = this.sfApi.getLinkedSetting(overrideKey) ?? false;
			initialSize = this.sfApi.getLinkedSetting(sizeKey) ?? 1;
		} else {
			initialOverride = settings[overrideKey];
			initialSize = settings[sizeKey];
		}

		renderToggleWithRevealCard(
			body,
			label,
			initialOverride,
			(value) => {
				void this.writeSizeSetting(overrideKey, value);
			},
			(card) => {
				let sliderSetting!: Setting;
				card.addSetting((setting) => {
					sliderSetting = setting;
					setting.setName(sliderLabel).addSlider((slider) =>
						slider
							.setLimits(min, max, 0.1)
							.setValue(initialSize)
							.onChange((value) => {
								void this.writeSizeSetting(sizeKey, value).then(() => restyle());
							}),
					);
				});
				return sliderSetting;
			},
			restyle,
			opts?.extraRowBefore,
			opts?.group,
		);
	}

	/** Linked sizes write through the host; code/quote sizes stay formatForge-local. */
	private writeSizeSetting(key: EditorSizeOverrideKey | EditorSizeKey, value: boolean | number): Promise<void> {
		if (this.sfApi && (isLinkedSizeOverride(key) || isLinkedSize(key))) {
			return this.plugin.updateHostOwnedSetting(key, value);
		}
		return this.plugin.updateSetting(key, value);
	}

	/**
	 * A colour swatch whose own picker carries a "Theme default" entry (at the bottom of its
	 * colour list) in place of the old separate "Override theme's default …" toggle. Picking a
	 * real colour turns `overrideKey` on; picking "Theme default" turns it off.
	 */
	private bindOverridableColorSwatch(
		buttonEl: HTMLElement,
		settings: FormatForgeSettings,
		overrideKey: keyof FormatForgeSettings,
		colorKey: keyof FormatForgeSettings,
		restyle: () => void,
	): void {
		bindColorSwatchButton(
			this.app,
			() => this.plugin.getPalette(),
			buttonEl,
			settings[colorKey] as string,
			(hex) => {
				void (async () => {
					await this.plugin.updateSetting(overrideKey, true);
					await this.plugin.updateSetting(colorKey, hex);
					restyle();
				})();
			},
			{
				isActive: !(settings[overrideKey] as boolean),
				onSelect: () => this.plugin.updateSetting(overrideKey, false).then(() => restyle()),
			},
		);
	}

	private renderColorOverrideCard(
		body: HTMLElement,
		settings: FormatForgeSettings,
		swatchLabel: string,
		overrideKey: keyof FormatForgeSettings,
		colorKey: keyof FormatForgeSettings,
		restyle: () => void,
		group?: SettingGroup,
	): void {
		const card = group ?? new SettingGroup(body);
		card.addSetting((setting) => {
			setting.setName(swatchLabel).addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, overrideKey, colorKey, restyle),
			);
		});
	}

	private renderEmphasisColorOverrideCard(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		const card = new SettingGroup(body);
		card.addSetting((setting) => {
			setting.setName("Bold colour").addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, "bodyTextOverrideEmphasisColor", "bodyTextBoldColor", restyle),
			);
		});
		card.addSetting((setting) => {
			setting.setName("Italic colour").addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, "bodyTextOverrideItalicColor", "bodyTextItalicColor", restyle),
			);
		});
	}

	private renderLinkStyleCard(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		const card = new SettingGroup(body);

		card.addSetting((setting) => {
			setting.setName("Link colour").addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, "bodyLinkOverrideColor", "bodyLinkColor", restyle),
			);
		});

		card.addSetting((setting) => {
			setting.setName("Hovered link colour").addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, "bodyLinkOverrideHoverColor", "bodyLinkHoverColor", restyle),
			);
		});

		card.addSetting((setting) => {
			setting
				.setName("Remove link underline")
				.setDesc("When on, body links render without an underline.")
				.addToggle((toggle) =>
					toggle.setValue(settings.bodyLinkRemoveUnderline).onChange((value) => {
						void this.plugin.updateSetting("bodyLinkRemoveUnderline", value).then(() => restyle());
					}),
				);
		});
	}

	private renderHighlightColorOverrideCard(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		const card = new SettingGroup(body);

		card.addSetting((setting) => {
			setting.setName("Highlight colour").addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, "bodyHighlightOverride", "bodyHighlightBgColor", restyle),
			);
		});

		card.addSetting((setting) => {
			setting.setName("Highlighted text colour").addButton((button) =>
				this.bindOverridableColorSwatch(button.buttonEl, settings, "bodyHighlightOverrideText", "bodyHighlightTextColor", restyle),
			);
		});
	}

	private renderFontCard(
		body: HTMLElement,
		settings: FormatForgeSettings,
		overrideFontKey: keyof FormatForgeSettings,
		fontWeightKey: keyof FormatForgeSettings,
		fontFamilyKey: keyof FormatForgeSettings,
		smallCapsKey?: keyof FormatForgeSettings,
		previewFontSizeEm?: number | (() => number),
		pickFontName?: string,
		themeDefaultPreviewFamily?: string,
	): SettingGroup {
		return renderCustomFontCard({
			app: this.app,
			host: this.plugin,
			body,
			settings: settings as unknown as Record<string, unknown>,
			overrideFontKey,
			fontWeightKey,
			fontFamilyKey,
			smallCapsKey,
			previewFontSizeEm,
			pickFontName,
			themeDefaultPreviewFamily: themeDefaultPreviewFamily ?? "var(--font-text)",
			restyle: () => this.plugin.applyEditorStyles(),
		});
	}

	/** Region preview size: the overridden slider value when size override is on, else 1em. */
	private regionPreviewSizeEm(overrideSizeKey: EditorSizeOverrideKey, sizeKey: EditorSizeKey): () => number {
		return () => {
			if (this.sfApi && isLinkedSizeOverride(overrideSizeKey) && isLinkedSize(sizeKey)) {
				const override = this.sfApi.getLinkedSetting(overrideSizeKey);
				const size = this.sfApi.getLinkedSetting(sizeKey);
				return override ? size || 1 : 1;
			}
			const settings = this.plugin.getTypedSettings();
			return settings[overrideSizeKey] ? settings[sizeKey] || 1 : 1;
		};
	}

	private renderDividerCard(
		body: HTMLElement,
		settings: FormatForgeSettings,
		aboveKey: keyof FormatForgeSettings,
		aboveThicknessKey: keyof FormatForgeSettings,
		belowKey: keyof FormatForgeSettings,
		belowThicknessKey: keyof FormatForgeSettings,
		restyle: () => void,
	): void {
		const card = new SettingGroup(body);

		let aboveToggle!: ToggleComponent;
		card.addSetting((setting) => {
			setting.setName("Divider line above header").addToggle((toggle) => {
				aboveToggle = toggle;
				toggle.setValue(settings[aboveKey] as boolean);
			});
		});
		let aboveThicknessSetting!: Setting;
		card.addSetting((setting) => {
			aboveThicknessSetting = setting;
			setting.setName("Thickness").addDropdown((dropdown) =>
				dropdown
					.addOption("thin", "Thin")
					.addOption("medium", "Medium")
					.addOption("thick", "Thick")
					.addOption("extra-thick", "Extra thick")
					.setValue(settings[aboveThicknessKey] as string)
					.onChange((value) => {
						void this.plugin.updateSetting(aboveThicknessKey, value).then(() => restyle());
					}),
			);
		});
		wireCardToggle(aboveToggle, aboveThicknessSetting, (value) => { void this.plugin.updateSetting(aboveKey, value); }, restyle);

		let belowToggle!: ToggleComponent;
		card.addSetting((setting) => {
			setting.setName("Divider line below header").addToggle((toggle) => {
				belowToggle = toggle;
				toggle.setValue(settings[belowKey] as boolean);
			});
		});
		let belowThicknessSetting!: Setting;
		card.addSetting((setting) => {
			belowThicknessSetting = setting;
			setting.setName("Thickness").addDropdown((dropdown) =>
				dropdown
					.addOption("thin", "Thin")
					.addOption("medium", "Medium")
					.addOption("thick", "Thick")
					.addOption("extra-thick", "Extra thick")
					.setValue(settings[belowThicknessKey] as string)
					.onChange((value) => {
						void this.plugin.updateSetting(belowThicknessKey, value).then(() => restyle());
					}),
			);
		});
		wireCardToggle(belowToggle, belowThicknessSetting, (value) => { void this.plugin.updateSetting(belowKey, value); }, restyle);
	}
}
