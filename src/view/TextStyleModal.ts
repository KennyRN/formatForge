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

type EditorSizeOverrideKey =
	| "bodyTextOverrideSize"
	| "heading1OverrideSize"
	| "heading2OverrideSize"
	| "heading3OverrideSize"
	| "heading4OverrideSize"
	| "heading5OverrideSize"
	| "heading6OverrideSize";

type EditorSizeKey =
	| "bodyTextSize"
	| "heading1Size"
	| "heading2Size"
	| "heading3Size"
	| "heading4Size"
	| "heading5Size"
	| "heading6Size";

export class TextStyleModal extends Modal {
	private plugin: FormatForgePlugin;
	private sfApi: SfFormattingApi | null;
	private selectedOtherHeadingLevel: 4 | 5 | 6 = 4;

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

		const cyclingGuideEnabled = () => Boolean(sfApi?.getLinkedSetting("cyclingGuideEnabled"));
		const remountPreview = () => {
			mountStylePreviewSample(preview, { cyclingGuideEnabled: cyclingGuideEnabled() });
			this.plugin.applyEditorScrollbarStyles();
			void registerCustomFontFaces(document).then(() => this.plugin.applyEditorStyles());
		};
		remountPreview();

		const tabs: StyleModalTab[] = [
			{
				id: "body",
				label: "Body",
				render: (body) => {
					this.renderSizeCard(body, "Override theme's default font size", "Font size", "bodyTextOverrideSize", "bodyTextSize", 0.7, 1.8, restyle);
					this.renderColorOverrideCard(body, settings, "Font colour", "bodyTextOverrideColor", "bodyTextColor", restyle);
					this.renderFontCard(
						body,
						settings,
						"bodyTextOverrideFont",
						"bodyTextFontWeight",
						"bodyTextFontFamily",
						undefined,
						this.regionPreviewSizeEm("bodyTextOverrideSize", "bodyTextSize"),
					);
					this.renderEmphasisColorOverrideCard(body, settings, restyle);
					this.renderLinkStyleCard(body, settings, restyle);
					this.renderHighlightColorOverrideCard(body, settings, restyle);
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
						(card) =>
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
					const levelGroup = new SettingGroup(body);
					const levelElements: Record<4 | 5 | 6, HTMLElement[]> = { 4: [], 5: [], 6: [] };
					const applySelectedLevel = (level: 4 | 5 | 6) => {
						for (const [key, els] of Object.entries(levelElements)) {
							const hidden = Number(key) !== level;
							for (const el of els) el.toggleClass("sf-settings-hidden", hidden);
						}
					};
					levelGroup.addSetting((setting) => {
						setting.setName("Choose heading level").addDropdown((dropdown) =>
							dropdown
								.addOption("4", "Heading 4")
								.addOption("5", "Heading 5")
								.addOption("6", "Heading 6")
								.setValue(String(this.selectedOtherHeadingLevel))
								.onChange((value) => {
									this.selectedOtherHeadingLevel = Number(value) as 4 | 5 | 6;
									applySelectedLevel(this.selectedOtherHeadingLevel);
								}),
						);
					});

					for (const n of [4, 5, 6] as const) {
						const before = body.children.length;
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
						levelElements[n] = Array.from(body.children).slice(before) as HTMLElement[];
					}

					applySelectedLevel(this.selectedOtherHeadingLevel);
				},
			},
			{
				id: "extras",
				label: "Extras",
				render: (body) => {
					this.renderEditorScrollbarGroup(body);
					if (sfApi) {
						this.renderCyclingGuideCard(body, sfApi, remountPreview);
					}
				},
			},
		];

		renderTabbedBody(controls, tabs);
	}

	private renderCyclingGuideCard(
		body: HTMLElement,
		sfApi: SfFormattingApi,
		onEnabledChange: () => void,
	): void {
		const s = sfApi.getLinkedSettings() as Record<string, unknown>;
		const cyclingGuideGroup = new SettingGroup(body);

		let cyclingGuideToggle!: ToggleComponent;
		cyclingGuideGroup.addSetting((setting) => {
			setting
				.setName("Cycling guide")
				.setDesc("Draws a floating guideline in the editor.")
				.addToggle((toggle) => {
					cyclingGuideToggle = toggle;
					toggle.setValue(s.cyclingGuideEnabled as boolean);
				});
		});

		let cyclingGuideThicknessSetting!: Setting;
		cyclingGuideGroup.addSetting((setting) => {
			cyclingGuideThicknessSetting = setting;
			setting.setName("Thickness").addDropdown((dropdown) =>
				dropdown
					.addOption("thin", "Thin")
					.addOption("medium", "Medium")
					.addOption("thick", "Thick")
					.addOption("extra-thick", "Extra thick")
					.setValue(s.cyclingGuideThickness as string)
					.onChange((value) => void sfApi.updateLinkedSetting("cyclingGuideThickness", value)),
			);
		});

		let cyclingGuideFlagSizeSetting!: Setting;
		cyclingGuideGroup.addSetting((setting) => {
			cyclingGuideFlagSizeSetting = setting;
			setting.setName("Flag size").addDropdown((dropdown) =>
				dropdown
					.addOption("small", "Small")
					.addOption("medium", "Medium")
					.addOption("large", "Large")
					.setValue(s.cyclingGuideFlagSize as string)
					.onChange((value) => void sfApi.updateLinkedSetting("cyclingGuideFlagSize", value)),
			);
		});

		let cyclingGuideRoundedLinesSetting!: Setting;
		cyclingGuideGroup.addSetting((setting) => {
			cyclingGuideRoundedLinesSetting = setting;
			setting
				.setName("Rounded lines")
				.setDesc("Rounds the corners of the divider line, except the bottom-right where the flag sits.")
				.addToggle((toggle) =>
					toggle
						.setValue(s.cyclingGuideRoundedLines as boolean)
						.onChange((value) => void sfApi.updateLinkedSetting("cyclingGuideRoundedLines", value)),
				);
		});

		let cyclingGuideIntervalSetting!: Setting;
		cyclingGuideGroup.addSetting((setting) => {
			cyclingGuideIntervalSetting = setting;
			setting.setName("Cycle length").addDropdown((dropdown) =>
				dropdown
					.addOption("short", "Short")
					.addOption("medium", "Medium")
					.addOption("large", "Long")
					.setValue(s.cyclingGuideInterval as string)
					.onChange((value) => void sfApi.updateLinkedSetting("cyclingGuideInterval", value)),
			);
		});

		let cyclingGuideColorSetting!: Setting;
		cyclingGuideGroup.addSetting((setting) => {
			cyclingGuideColorSetting = setting;
			setting.setName("Line colour").addButton((button) =>
				bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.cyclingGuideColor as string, (hex) => {
					void sfApi.updateLinkedSetting("cyclingGuideColor", hex);
				}),
			);
		});

		const applyCyclingGuideVisibility = (hidden: boolean) => {
			cyclingGuideThicknessSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			cyclingGuideFlagSizeSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			cyclingGuideRoundedLinesSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			cyclingGuideIntervalSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			cyclingGuideColorSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		cyclingGuideToggle.onChange((value) => {
			void sfApi.updateLinkedSetting("cyclingGuideEnabled", value).then(() => {
				applyCyclingGuideVisibility(!value);
				onEnabledChange();
			});
		});
		applyCyclingGuideVisibility(!(s.cyclingGuideEnabled as boolean));
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
		extraRowBefore?: (card: SettingGroup) => void,
	): void {
		const settings = this.plugin.getTypedSettings();
		const initialOverride = this.sfApi
			? ((this.sfApi.getLinkedSetting(overrideKey) as boolean) ?? false)
			: settings[overrideKey];
		const initialSize = this.sfApi
			? ((this.sfApi.getLinkedSetting(sizeKey) as number) ?? 1)
			: settings[sizeKey];

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
			extraRowBefore,
		);
	}

	/** Sizes live on both sides, so route through the host-owned writer to keep the local mirror current. */
	private writeSizeSetting(key: EditorSizeOverrideKey | EditorSizeKey, value: boolean | number): Promise<void> {
		return this.plugin.updateHostOwnedSetting(key, value);
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
	): void {
		const card = new SettingGroup(body);
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
	): void {
		renderCustomFontCard({
			app: this.app,
			host: this.plugin,
			body,
			settings: settings as unknown as Record<string, unknown>,
			overrideFontKey,
			fontWeightKey,
			fontFamilyKey,
			smallCapsKey,
			previewFontSizeEm,
			restyle: () => this.plugin.applyEditorStyles(),
		});
	}

	/** Region preview size: the overridden slider value when size override is on, else 1em. */
	private regionPreviewSizeEm(overrideSizeKey: EditorSizeOverrideKey, sizeKey: EditorSizeKey): () => number {
		return () => {
			if (this.sfApi) {
				const linked = this.sfApi.getLinkedSettings();
				return linked[overrideSizeKey] ? Number(linked[sizeKey]) || 1 : 1;
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
