import { App, Modal, Setting, SettingGroup, ToggleComponent } from "obsidian";
import type FormatForgePlugin from "../main";
import type { FormatForgeSettings } from "../settings";
import type { SfFormattingApi, SfLinkedFormattingKey } from "../storyforgeBridge";
import {
	bindColorSwatchButton,
	renderCustomFontCard,
	renderTabbedBody,
	renderToggleWithRevealCard,
	wireCardToggle,
	type StyleModalTab,
} from "./styleModalHelpers";

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
						const sizeKey = `heading${n}Size` as SfLinkedFormattingKey;
						const overrideSizeKey = `heading${n}OverrideSize` as SfLinkedFormattingKey;
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
		];

		renderTabbedBody(contentEl, tabs);
	}

	/**
	 * Size cards write to SF linked settings (sizes are SF-owned).
	 * When sfApi is unavailable, the card shows a disabled notice instead.
	 */
	private renderSizeCard(
		body: HTMLElement,
		label: string,
		sliderLabel: string,
		overrideKey: SfLinkedFormattingKey,
		sizeKey: SfLinkedFormattingKey,
		min: number,
		max: number,
		restyle: () => void,
		extraRowBefore?: (card: SettingGroup) => void,
	): void {
		const sfApi = this.sfApi;
		const initialOverride = sfApi ? (sfApi.getLinkedSetting(overrideKey) as boolean) ?? false : false;
		const initialSize = sfApi ? (sfApi.getLinkedSetting(sizeKey) as number) ?? 1 : 1;

		renderToggleWithRevealCard(
			body,
			label,
			initialOverride,
			(value) => {
				if (sfApi) void sfApi.updateLinkedSetting(overrideKey, value);
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
								if (sfApi) void sfApi.updateLinkedSetting(sizeKey, value).then(() => restyle());
							}),
					);
					if (!sfApi) {
						setting.setDesc("storyForge not found — size controls unavailable.");
					}
				});
				return sliderSetting;
			},
			restyle,
			extraRowBefore,
		);
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
	private regionPreviewSizeEm(overrideSizeKey: SfLinkedFormattingKey, sizeKey: SfLinkedFormattingKey): () => number {
		return () => {
			if (!this.sfApi) return 1;
			const linked = this.sfApi.getLinkedSettings();
			return linked[overrideSizeKey] ? Number(linked[sizeKey]) || 1 : 1;
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
