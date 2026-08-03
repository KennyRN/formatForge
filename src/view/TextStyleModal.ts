import { App, Modal, Setting, SettingGroup, ToggleComponent } from "obsidian";
import type FormatForgePlugin from "../main";
import { registerCustomFontFaces } from "../fonts";
import type { EditorScrollbarThickness, FormatForgeSettings } from "../settings";
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
		const sfApi = this.plugin.getStoryForgeApi() ?? this.sfApi;
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
					let emphasisLabelSetting: Setting | undefined;
					const emphasisLabel = () =>
						settings.bodyTextOverrideColor ? "Override body text's standard italic/bold colour" : "Override theme's default italic/bold colour";
					this.renderColorOverrideCard(
						body,
						settings,
						"Override theme's default font colour",
						"Font colour",
						"bodyTextOverrideColor",
						"bodyTextColor",
						restyle,
						() => {
							emphasisLabelSetting?.setName(emphasisLabel());
						},
					);
					this.renderFontCard(
						body,
						settings,
						"bodyTextOverrideFont",
						"bodyTextFontWeight",
						"bodyTextFontFamily",
						undefined,
						this.regionPreviewSizeEm("bodyTextOverrideSize", "bodyTextSize"),
					);
					emphasisLabelSetting = this.renderEmphasisColorOverrideCard(body, settings, emphasisLabel(), restyle);
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
					this.renderColorOverrideCard(body, settings, "Override theme's default header colour", "Header colour", "heading1OverrideColor", "heading1Color", restyle);
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
					this.renderColorOverrideCard(body, settings, "Override theme's default header colour", "Header colour", "heading2OverrideColor", "heading2Color", restyle);
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
					this.renderColorOverrideCard(body, settings, "Override theme's default header colour", "Header colour", "heading3OverrideColor", "heading3Color", restyle);
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
						this.renderColorOverrideCard(body, settings, "Override theme's default header colour", "Header colour", `heading${n}OverrideColor`, `heading${n}Color`, restyle);
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
							const thickness = (EDITOR_SCROLLBAR_THICKNESS_ORDER[idx] ?? "thick") as EditorScrollbarThickness;
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

	private writeSizeSetting(key: EditorSizeOverrideKey | EditorSizeKey, value: boolean | number): Promise<void> {
		if (this.sfApi) {
			return this.sfApi.updateLinkedSetting(key, value);
		}
		return this.plugin.updateSetting(key, value);
	}

	private renderColorOverrideCard(
		body: HTMLElement,
		settings: FormatForgeSettings,
		label: string,
		swatchLabel: string,
		overrideKey: keyof FormatForgeSettings,
		colorKey: keyof FormatForgeSettings,
		restyle: () => void,
		onToggle?: (value: boolean) => void,
	): void {
		renderToggleWithRevealCard(
			body,
			label,
			settings[overrideKey] as boolean,
			(value) => {
				void this.plugin.updateSetting(overrideKey, value).then(() => onToggle?.(value));
			},
			(card) => {
				let colorSetting!: Setting;
				card.addSetting((setting) => {
					colorSetting = setting;
					setting.setName(swatchLabel).addButton((button) =>
						bindColorSwatchButton(
							this.app,
							() => this.plugin.getPalette(),
							button.buttonEl,
							settings[colorKey] as string,
							(hex) => {
								void this.plugin.updateSetting(colorKey, hex).then(() => restyle());
							},
						),
					);
				});
				return colorSetting;
			},
			restyle,
		);
	}

	private renderEmphasisColorOverrideCard(body: HTMLElement, settings: FormatForgeSettings, label: string, restyle: () => void): Setting {
		const card = new SettingGroup(body);

		let toggle!: ToggleComponent;
		let toggleSetting!: Setting;
		card.addSetting((setting) => {
			toggleSetting = setting;
			setting.setName(label).addToggle((t) => {
				toggle = t;
				t.setValue(settings.bodyTextOverrideEmphasisColor);
			});
		});

		let boldColorSetting!: Setting;
		card.addSetting((setting) => {
			boldColorSetting = setting;
			setting.setName("Bold colour").addButton((button) =>
				bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, settings.bodyTextBoldColor, (hex) => {
					void this.plugin.updateSetting("bodyTextBoldColor", hex).then(() => restyle());
				}),
			);
		});

		let italicColorSetting!: Setting;
		card.addSetting((setting) => {
			italicColorSetting = setting;
			setting.setName("Italic colour").addButton((button) =>
				bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, settings.bodyTextItalicColor, (hex) => {
					void this.plugin.updateSetting("bodyTextItalicColor", hex).then(() => restyle());
				}),
			);
		});

		const applyVisibility = (hidden: boolean) => {
			boldColorSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			italicColorSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		toggle.onChange((value) => {
			void this.plugin.updateSetting("bodyTextOverrideEmphasisColor", value).then(() => {
				applyVisibility(!value);
				restyle();
			});
		});
		applyVisibility(!toggle.getValue());

		return toggleSetting;
	}

	private renderLinkStyleCard(body: HTMLElement, settings: FormatForgeSettings, restyle: () => void): void {
		const card = new SettingGroup(body);

		let colorToggle!: ToggleComponent;
		card.addSetting((setting) => {
			setting.setName("Override theme's default link colour").addToggle((t) => {
				colorToggle = t;
				t.setValue(settings.bodyLinkOverrideColor);
			});
		});

		let linkColorSetting!: Setting;
		card.addSetting((setting) => {
			linkColorSetting = setting;
			setting.setName("Link colour").addButton((button) =>
				bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, settings.bodyLinkColor, (hex) => {
					void this.plugin.updateSetting("bodyLinkColor", hex).then(() => restyle());
				}),
			);
		});

		const applyColorVisibility = (hidden: boolean) => {
			linkColorSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		colorToggle.onChange((value) => {
			void this.plugin.updateSetting("bodyLinkOverrideColor", value).then(() => {
				applyColorVisibility(!value);
				restyle();
			});
		});
		applyColorVisibility(!colorToggle.getValue());

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

		let toggle!: ToggleComponent;
		card.addSetting((setting) => {
			setting.setName("Override theme's default highlight colours").addToggle((t) => {
				toggle = t;
				t.setValue(settings.bodyHighlightOverride);
			});
		});

		let bgColorSetting!: Setting;
		card.addSetting((setting) => {
			bgColorSetting = setting;
			setting.setName("Highlight colour").addButton((button) =>
				bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, settings.bodyHighlightBgColor, (hex) => {
					void this.plugin.updateSetting("bodyHighlightBgColor", hex).then(() => restyle());
				}),
			);
		});

		let textColorSetting!: Setting;
		card.addSetting((setting) => {
			textColorSetting = setting;
			setting.setName("Highlighted text colour").addButton((button) =>
				bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, settings.bodyHighlightTextColor, (hex) => {
					void this.plugin.updateSetting("bodyHighlightTextColor", hex).then(() => restyle());
				}),
			);
		});

		const applyVisibility = (hidden: boolean) => {
			bgColorSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			textColorSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		toggle.onChange((value) => {
			void this.plugin.updateSetting("bodyHighlightOverride", value).then(() => {
				applyVisibility(!value);
				restyle();
			});
		});
		applyVisibility(!toggle.getValue());
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
