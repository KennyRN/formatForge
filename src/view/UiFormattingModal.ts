import { App, Modal, Setting, SettingGroup, ToggleComponent } from "obsidian";
import type FormatForgePlugin from "../main";
import type { SfFormattingApi, SfLinkedFormattingKey } from "../storyforgeBridge";
import { bindColorSwatchButton, bindExclusivePair, renderCustomFontCard, renderTabbedBody, type FontCardHost, type StyleModalTab } from "./styleModalHelpers";
import {
	mountRightSidebarPreviewSample,
	mountUiStylePreviewSample,
	type RightSidebarPreviewMode,
} from "./uiStylePreviewSample";

/**
 * Wraps the SF formatting API so `renderCustomFontCard` can write linked settings
 * through the same `FontCardHost` interface used by TextStyleModal for FF settings.
 */
class SfLinkedSettingsAdapter implements FontCardHost {
	constructor(private readonly sfApi: SfFormattingApi) {}

	getSettings(): Record<string, unknown> {
		return this.sfApi.getLinkedSettings();
	}

	async updateSetting(key: string, value: unknown): Promise<void> {
		await this.sfApi.updateLinkedSetting(key as SfLinkedFormattingKey, value);
	}
}

export class UiFormattingModal extends Modal {
	private plugin: FormatForgePlugin;
	private sfApi: SfFormattingApi | null;
	private sfHost: SfLinkedSettingsAdapter | null;

	constructor(app: App, plugin: FormatForgePlugin, sfApi: SfFormattingApi | null) {
		super(app);
		this.plugin = plugin;
		this.sfApi = sfApi;
		this.sfHost = sfApi ? new SfLinkedSettingsAdapter(sfApi) : null;
	}

	onOpen(): void {
		this.modalEl.addClass("sf-ui-formatting-modal");
		this.modalEl.addClass("ff-ui-formatting-modal");
		this.titleEl.remove();
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("sf-ui-formatting-modal");

		// Re-read every render: storyForge can connect or disconnect while this modal is open.
		const liveApi = this.plugin.getStoryForgeApi();
		this.sfApi = liveApi;
		this.sfHost = liveApi ? new SfLinkedSettingsAdapter(liveApi) : null;

		if (!this.sfApi || !this.sfHost) {
			contentEl.createEl("p", {
				text: "storyForge is not connected yet. Text styling still works; interface chrome appears once storyForge is enabled.",
				cls: "ff-settings-description",
			});
			return;
		}

		const sfApi = this.sfApi;
		const sfHost = this.sfHost;
		const s = sfApi.getLinkedSettings() as Record<string, unknown>;

		const layout = contentEl.createDiv({ cls: "ff-text-style-layout" });
		const controls = layout.createDiv({ cls: "ff-text-style-controls" });
		const previewPane = layout.createDiv({ cls: "ff-style-preview-pane" });
		previewPane.createDiv({ cls: "ff-style-preview-label", text: "Preview" });
		const preview = previewPane.createDiv({ cls: "ff-style-preview ff-ui-style-preview" });
		const leftPreview = preview.createDiv();
		const rightPreview = preview.createDiv({ cls: "sf-settings-hidden" });
		mountUiStylePreviewSample(leftPreview);
		let rightPreviewMode: RightSidebarPreviewMode = "chrome";
		mountRightSidebarPreviewSample(rightPreview, rightPreviewMode);
		const setRightPreviewMode = (mode: RightSidebarPreviewMode) => {
			rightPreviewMode = mode;
			if (!rightPreview.hasClass("sf-settings-hidden")) {
				mountRightSidebarPreviewSample(rightPreview, rightPreviewMode);
			}
		};

		const panelTabs: StyleModalTab[] = [
			{
				id: "guides",
				label: "Guides",
				render: (body) => {
					this.renderHighlightGroup(body, s, sfApi);
				},
			},
			{
				id: "library",
				label: "Library",
				render: (body) => {
					this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
						labelPrefix: "Series title",
						sizeKey: "librarySeriesTitleFontSize",
						overrideFontKey: "librarySeriesTitleOverrideFont",
						fontFamilyKey: "librarySeriesTitleFontFamily",
						fontWeightKey: "librarySeriesTitleFontWeight",
						colorKey: "librarySeriesTitleColor",
						smallCapsKey: "librarySeriesTitleSmallCaps",
					});
					this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
						labelPrefix: "Book title",
						sizeKey: "libraryBookTitleFontSize",
						overrideFontKey: "libraryBookTitleOverrideFont",
						fontFamilyKey: "libraryBookTitleFontFamily",
						fontWeightKey: "libraryBookTitleFontWeight",
						colorKey: "libraryBookTitleColor",
						smallCapsKey: "libraryBookTitleSmallCaps",
					});
					this.renderSubtitleStyleGroup(body, s, sfApi, sfHost);
					this.renderLibraryItemsGroup(body, s, sfApi, sfHost);
					this.renderLibraryHighlightRows(body, s, sfApi);
					new SettingGroup(body).addSetting((setting) => {
						setting
							.setName("Divider below title")
							.setDesc("Adds a border below the series/book title, matching the border between storyForge's panes.")
							.addToggle((toggle) =>
								toggle
									.setValue(s.libraryHeaderDividerBelow as boolean)
									.onChange((value) => void sfApi.updateLinkedSetting("libraryHeaderDividerBelow", value)),
							);
					});
					this.renderSeriesPaneContent(body, s, sfApi);
				},
			},
			{
				id: "unplaced",
				label: "Unplaced",
				render: (body) => {
					this.renderUnplacedPanelContent(body, s, sfApi, sfHost);
				},
			},
			{
				id: "codex",
				label: "Codex",
				render: (body) => {
					this.renderCodexPanelContent(body, s, sfApi, sfHost);
				},
			},
		];

		// Story Context colour swatches live across the three context sub-tabs, but the
		// "use header colour for everything" toggle that hides them sits in Navigation.
		const contextColourSettings: Setting[] = [];
		const applyUseHeaderColorVisibility = (hidden: boolean) => {
			for (const setting of contextColourSettings) {
				setting.settingEl.toggleClass("sf-settings-hidden", hidden);
			}
		};

		const contextTabs: StyleModalTab[] = [
			{
				id: "novel",
				label: "Novel",
				render: (body) => this.renderContextNovelContent(body, s, sfApi, sfHost, contextColourSettings),
			},
			{
				id: "chapter",
				label: "Chapter",
				render: (body) => this.renderContextChapterContent(body, s, sfApi, sfHost, contextColourSettings),
			},
			{
				id: "dossier",
				label: "Dossier",
				render: (body) => this.renderContextDossierContent(body, s, sfApi, sfHost, contextColourSettings),
			},
		];

		let contextTabId = "novel";
		const rightTabs: StyleModalTab[] = [
			{
				id: "chrome",
				label: "Navigation",
				render: (body) =>
					this.renderPanelChromeContent(body, s, sfApi, sfHost, contextColourSettings, applyUseHeaderColorVisibility),
			},
			{
				id: "story-context",
				label: "Story Context",
				render: (body) =>
					renderTabbedBody(body, contextTabs, {
						onActivate: (id) => {
							contextTabId = id;
							setRightPreviewMode(id as RightSidebarPreviewMode);
						},
					}),
			},
			{
				id: "archive",
				label: "Archive",
				render: (body) => this.renderRightRailPanelContent(body, s, sfApi, sfHost, "archive"),
			},
		];

		const outerTabs: StyleModalTab[] = [
			{
				id: "storyforge-panel",
				label: "storyForge panel",
				render: (body) => renderTabbedBody(body, panelTabs),
			},
			{
				id: "right-sidebar",
				label: "Right sidebar",
				render: (body) =>
					renderTabbedBody(body, rightTabs, {
						onActivate: (id) => {
							setRightPreviewMode(
								(id === "story-context" ? contextTabId : id) as RightSidebarPreviewMode,
							);
						},
					}),
			},
		];

		renderTabbedBody(controls, outerTabs, {
			onActivate: (id) => {
				leftPreview.toggleClass("sf-settings-hidden", id !== "storyforge-panel");
				rightPreview.toggleClass("sf-settings-hidden", id !== "right-sidebar");
				if (id === "right-sidebar") {
					mountRightSidebarPreviewSample(rightPreview, rightPreviewMode);
				}
			},
		});

		// Runs once every context sub-tab has contributed its colour swatches.
		applyUseHeaderColorVisibility(s.recommendUseHeaderColorForAll as boolean);
	}

	private renderHighlightGroup(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi): void {
		const highlightGroup = new SettingGroup(body);
		highlightGroup.addSetting((setting) => {
			setting
				.setName("Highlight active chapter/item")
				.setDesc("Highlights the currently selected chapter, or item, in the storyForge panel.")
				.addToggle((toggle) =>
					toggle
						.setValue(s.highlightActiveChapter as boolean)
						.onChange((value) => void sfApi.updateLinkedSetting("highlightActiveChapter", value)),
				);
		});
	}

	private renderTitleStyleGroup(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		config: {
			labelPrefix: string;
			sizeKey: SfLinkedFormattingKey;
			overrideFontKey: SfLinkedFormattingKey;
			fontFamilyKey: SfLinkedFormattingKey;
			fontWeightKey: SfLinkedFormattingKey;
			colorKey: SfLinkedFormattingKey;
			smallCapsKey: SfLinkedFormattingKey;
			mutedKey?: SfLinkedFormattingKey;
		},
	): { colorSetting: Setting } {
		const group = new SettingGroup(body);
		group.addSetting((setting) => {
			setting
				.setName(`${config.labelPrefix} size`)
				.setDesc("Text size, from 0.5em to 2em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 2, 0.1)
						.setValue(s[config.sizeKey] as number)
						.onChange((value) => void sfApi.updateLinkedSetting(config.sizeKey, value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()[config.sizeKey]) || 1,
			settings: s,
			group,
			overrideFontKey: config.overrideFontKey,
			fontFamilyKey: config.fontFamilyKey,
			fontWeightKey: config.fontWeightKey,
			restyle: () => sfApi.applyLinkedStyles(),
		});
		let colorSetting!: Setting;
		group
			.addSetting((setting) => {
				colorSetting = setting;
				setting
					.setName(`${config.labelPrefix} colour`)
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s[config.colorKey] as string, (hex) => {
							void sfApi.updateLinkedSetting(config.colorKey, hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName(`${config.labelPrefix} small caps`)
					.addToggle((toggle) =>
						toggle
							.setValue(s[config.smallCapsKey] as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting(config.smallCapsKey, value)),
					);
				setting.nameEl.addClass("sf-small-caps-label");
			});
		if (config.mutedKey) {
			const mutedKey = config.mutedKey;
			group.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc(`Override ${config.labelPrefix.toLowerCase()} colour with muted colour.`)
					.addToggle((toggle) =>
						toggle
							.setValue(s[mutedKey] as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting(mutedKey, value)),
					);
			});
		}
		return { colorSetting };
	}

	private renderSubtitleStyleGroup(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi, sfHost: FontCardHost): void {
		const group = new SettingGroup(body);
		group.addSetting((setting) => {
			setting
				.setName("Subtitle size")
				.setDesc("Text size, from 0.5em to 2em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 2, 0.1)
						.setValue(s.libraryBookSubtitleFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("libraryBookSubtitleFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["libraryBookSubtitleFontSize"]) || 1,
			settings: s,
			group,
			overrideFontKey: "libraryBookSubtitleOverrideFont",
			fontFamilyKey: "libraryBookSubtitleFontFamily",
			fontWeightKey: "libraryBookSubtitleFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		group.addSetting((setting) => {
			setting
				.setName("Subtitle small caps")
				.addToggle((toggle) =>
					toggle
						.setValue(s.libraryBookSubtitleSmallCaps as boolean)
						.onChange((value) => void sfApi.updateLinkedSetting("libraryBookSubtitleSmallCaps", value)),
				);
			setting.nameEl.addClass("sf-small-caps-label");
		});
	}

	private renderLibraryItemsGroup(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi, sfHost: FontCardHost): void {
		const group = new SettingGroup(body);
		group.setHeading("Books & chapters");
		group.addSetting((setting) => {
			setting
				.setName("Library items")
				.setDesc("Text size of books and chapters in the Library list, from 0.5em to 1.5em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.libraryItemsFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("libraryItemsFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["libraryItemsFontSize"]) || 1,
			settings: s,
			group,
			overrideFontKey: "libraryItemsOverrideFont",
			fontFamilyKey: "libraryItemsFontFamily",
			fontWeightKey: "libraryItemsFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		group
			.addSetting((setting) => {
				setting
					.setName("Library items colour")
					.setDesc("Normal text colour of books and chapters in the Library list (not the header titles).")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.libraryItemsColor as string, (hex) => {
							void sfApi.updateLinkedSetting("libraryItemsColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s.libraryItemsMuted as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting("libraryItemsMuted", value)),
					);
			});
	}

	private renderLibraryHighlightRows(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi): void {
		const libraryHighlightGroup = new SettingGroup(body);
		libraryHighlightGroup
			.addSetting((setting) => {
				setting
					.setName("Highlight colour for library items")
					.setDesc("The colour used for the active chapter/item highlight.")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.highlightColor as string, (hex) => {
							void sfApi.updateLinkedSetting("highlightColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Highlight text colour for library items")
					.setDesc("Colour used for the active chapter/item highlight text.")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.highlightTextColor as string, (hex) => {
							void sfApi.updateLinkedSetting("highlightTextColor", hex);
						}),
					);
			});
	}

	private renderHeaderStyleGroup(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		config: {
			sizeKey: SfLinkedFormattingKey;
			overrideFontKey: SfLinkedFormattingKey;
			fontFamilyKey: SfLinkedFormattingKey;
			fontWeightKey: SfLinkedFormattingKey;
			colorKey: SfLinkedFormattingKey;
			mutedKey: SfLinkedFormattingKey;
			smallCapsKey: SfLinkedFormattingKey;
			useHeaderColorForAllKey: SfLinkedFormattingKey;
		},
	): ToggleComponent {
		const group = new SettingGroup(body);
		let useHeaderColorForAllToggle!: ToggleComponent;
		group.addSetting((setting) => {
			setting
				.setName("Header size")
				.setDesc("Size of header label and icon.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s[config.sizeKey] as number)
						.onChange((value) => void sfApi.updateLinkedSetting(config.sizeKey, value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()[config.sizeKey]) || 1,
			settings: s,
			group,
			overrideFontKey: config.overrideFontKey,
			fontFamilyKey: config.fontFamilyKey,
			fontWeightKey: config.fontWeightKey,
			restyle: () => sfApi.applyLinkedStyles(),
		});
		group
			.addSetting((setting) => {
				setting
					.setName("Header colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s[config.colorKey] as string, (hex) => {
							void sfApi.updateLinkedSetting(config.colorKey, hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Use header colour for all colour options")
					.setDesc("Use the header colour everywhere below instead of picking separate colours.")
					.addToggle((toggle) => {
						useHeaderColorForAllToggle = toggle;
						toggle.setValue(s[config.useHeaderColorForAllKey] as boolean);
					});
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override header colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s[config.mutedKey] as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting(config.mutedKey, value)),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Small caps")
					.addToggle((toggle) =>
						toggle
							.setValue(s[config.smallCapsKey] as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting(config.smallCapsKey, value)),
					);
				setting.nameEl.addClass("sf-small-caps-label");
			});
		return useHeaderColorForAllToggle;
	}

	private renderUnplacedPanelContent(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi, sfHost: FontCardHost): void {
		const useHeaderColorToggle = this.renderHeaderStyleGroup(body, s, sfApi, sfHost, {
			sizeKey: "unplacedFontSize",
			overrideFontKey: "unplacedOverrideFont",
			fontFamilyKey: "unplacedFontFamily",
			fontWeightKey: "unplacedFontWeight",
			colorKey: "unplacedColor",
			mutedKey: "unplacedMuted",
			smallCapsKey: "unplacedSmallCaps",
			useHeaderColorForAllKey: "unplacedUseHeaderColorForAll",
		});

		const unplacedItemsGroup = new SettingGroup(body);
		let itemsColourSetting!: Setting;
		unplacedItemsGroup.addSetting((setting) => {
			setting
				.setName("Unplaced items")
				.setDesc("Text size of items in the Unplaced pane, from 0.5em to 1.5em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.unplacedItemsFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("unplacedItemsFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["unplacedItemsFontSize"]) || 1,
			settings: s,
			group: unplacedItemsGroup,
			overrideFontKey: "unplacedItemsOverrideFont",
			fontFamilyKey: "unplacedItemsFontFamily",
			fontWeightKey: "unplacedItemsFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		unplacedItemsGroup
			.addSetting((setting) => {
				itemsColourSetting = setting;
				setting
					.setName("Unplaced items colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.unplacedItemsColor as string, (hex) => {
							void sfApi.updateLinkedSetting("unplacedItemsColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s.unplacedItemsMuted as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting("unplacedItemsMuted", value)),
					);
			});

		const unplacedHighlightGroup = new SettingGroup(body);
		let highlightColourSetting!: Setting;
		unplacedHighlightGroup
			.addSetting((setting) => {
				highlightColourSetting = setting;
				setting
					.setName("Highlight colour")
					.setDesc("Highlights the currently selected chapter in the storyForge panel (per-panel mode).")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.unplacedHighlightColor as string, (hex) => {
							void sfApi.updateLinkedSetting("unplacedHighlightColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Highlight text colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.unplacedHighlightTextColor as string, (hex) => {
							void sfApi.updateLinkedSetting("unplacedHighlightTextColor", hex);
						}),
					);
			});

		const applyUseHeaderColorVisibility = (hidden: boolean) => {
			itemsColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			highlightColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		useHeaderColorToggle.onChange((value) => {
			void sfApi.updateLinkedSetting("unplacedUseHeaderColorForAll", value).then(() => {
				applyUseHeaderColorVisibility(value);
			});
		});
		applyUseHeaderColorVisibility(s.unplacedUseHeaderColorForAll as boolean);
	}

	private renderCodexPanelContent(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi, sfHost: FontCardHost): void {
		const useHeaderColorToggle = this.renderHeaderStyleGroup(body, s, sfApi, sfHost, {
			sizeKey: "codexFontSize",
			overrideFontKey: "codexOverrideFont",
			fontFamilyKey: "codexFontFamily",
			fontWeightKey: "codexFontWeight",
			colorKey: "codexColor",
			mutedKey: "codexMuted",
			smallCapsKey: "codexSmallCaps",
			useHeaderColorForAllKey: "codexUseHeaderColorForAll",
		});

		const codexFolderGroup = new SettingGroup(body);
		let folderColourSetting!: Setting;
		codexFolderGroup.addSetting((setting) => {
			setting
				.setName("Folder size")
				.setDesc("Font size of the codex folder names and chevrons, from 0.5em to 1.5em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.codexFolderFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("codexFolderFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["codexFolderFontSize"]) || 1,
			settings: s,
			group: codexFolderGroup,
			overrideFontKey: "codexFolderOverrideFont",
			fontFamilyKey: "codexFolderFontFamily",
			fontWeightKey: "codexFolderFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		codexFolderGroup
			.addSetting((setting) => {
				folderColourSetting = setting;
				setting
					.setName("Folder colour")
					.setDesc("Colour of the codex folder names and chevrons.")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.codexFolderColor as string, (hex) => {
							void sfApi.updateLinkedSetting("codexFolderColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Folder indicator line")
					.setDesc("Vertical guide line showing nesting inside a folder.")
					.addDropdown((dropdown) =>
						dropdown
							.addOption("none", "None")
							.addOption("thin", "Thin")
							.addOption("medium", "Medium")
							.addOption("thick", "Thick")
							.setValue(s.codexFolderIndicatorThickness as string)
							.onChange((value) => void sfApi.updateLinkedSetting("codexFolderIndicatorThickness", value)),
					);
			});

		const codexNoteLabelGroup = new SettingGroup(body);
		let defaultToggle!: ToggleComponent;
		let folderToggle!: ToggleComponent;
		let noteLabelColourSetting!: Setting;
		let defaultColourToggleSetting!: Setting;
		let folderColourToggleSetting!: Setting;
		codexNoteLabelGroup.addSetting((setting) => {
			setting
				.setName("Codex note label size")
				.setDesc("Font size of the codex note (file) labels, from 0.5em to 1.5em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.codexNoteLabelFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("codexNoteLabelFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["codexNoteLabelFontSize"]) || 1,
			settings: s,
			group: codexNoteLabelGroup,
			overrideFontKey: "codexNoteLabelOverrideFont",
			fontFamilyKey: "codexNoteLabelFontFamily",
			fontWeightKey: "codexNoteLabelFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		codexNoteLabelGroup
			.addSetting((setting) => {
				noteLabelColourSetting = setting;
				setting
					.setName("Codex note label colour")
					.setDesc("Colour of the codex note (file) labels.")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.codexNoteLabelColor as string, (hex) => {
							void sfApi.updateLinkedSetting("codexNoteLabelColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				defaultColourToggleSetting = setting;
				setting
					.setName("Use default colour for Codex note label")
					.setDesc("Overrides the note colour and sets it the same as the body text.")
					.addToggle((toggle) => {
						defaultToggle = toggle;
						toggle.setValue(s.codexNoteLabelUseDefaultColor as boolean);
					});
			})
			.addSetting((setting) => {
				folderColourToggleSetting = setting;
				setting
					.setName("Use folder colour for Codex notes")
					.setDesc("Overrides the note colour and sets it the same as the codex folder colour.")
					.addToggle((toggle) => {
						folderToggle = toggle;
						toggle.setValue(s.codexNoteLabelUseFolderColor as boolean);
					});
			});
		bindExclusivePair(
			defaultToggle,
			folderToggle,
			(value) => void sfApi.updateLinkedSetting("codexNoteLabelUseDefaultColor", value),
			(value) => void sfApi.updateLinkedSetting("codexNoteLabelUseFolderColor", value),
		);

		const codexHighlightGroup = new SettingGroup(body);
		let codexHighlightColourSetting!: Setting;
		codexHighlightGroup
			.addSetting((setting) => {
				codexHighlightColourSetting = setting;
				setting
					.setName("Highlight colour")
					.setDesc("Highlights the currently selected note in the codex panel (per-panel mode).")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.codexHighlightColor as string, (hex) => {
							void sfApi.updateLinkedSetting("codexHighlightColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Highlight text colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.codexHighlightTextColor as string, (hex) => {
							void sfApi.updateLinkedSetting("codexHighlightTextColor", hex);
						}),
					);
			});

		const applyUseHeaderColorVisibility = (hidden: boolean) => {
			folderColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			noteLabelColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			defaultColourToggleSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			folderColourToggleSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			codexHighlightColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		useHeaderColorToggle.onChange((value) => {
			void sfApi.updateLinkedSetting("codexUseHeaderColorForAll", value).then(() => {
				applyUseHeaderColorVisibility(value);
			});
		});
		applyUseHeaderColorVisibility(s.codexUseHeaderColorForAll as boolean);
	}

	/**
	 * Chrome shared by the right sidebar: Forge companion icons plus the Story Context
	 * header and its Novel / Chapter / Dossier tab strip.
	 */
	private renderPanelChromeContent(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		colourSettings: Setting[],
		applyUseHeaderColorVisibility: (hidden: boolean) => void,
	): void {
		const forgeGroup = new SettingGroup(body);
		forgeGroup.addSetting((setting) => {
			setting
				.setName("Forge family icon colour")
				.setDesc("Colour of companion icons in the Forge sidebar tab.")
				.addButton((button) =>
					bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.forgeCompanionIconColor as string, (hex) => {
						void sfApi.updateLinkedSetting("forgeCompanionIconColor", hex);
					}),
				);
		});

		const useHeaderColorToggle = this.renderHeaderStyleGroup(body, s, sfApi, sfHost, {
			sizeKey: "recommendHeaderFontSize",
			overrideFontKey: "recommendHeaderOverrideFont",
			fontFamilyKey: "recommendHeaderFontFamily",
			fontWeightKey: "recommendHeaderFontWeight",
			colorKey: "recommendHeaderColor",
			mutedKey: "recommendHeaderMuted",
			smallCapsKey: "recommendHeaderSmallCaps",
			useHeaderColorForAllKey: "recommendUseHeaderColorForAll",
		});

		// Novel | Chapter | Dossier tabs
		const tabsGroup = new SettingGroup(body);
		tabsGroup.addSetting((setting) => {
			setting
				.setName("Tab size")
				.setDesc("Text size of the Novel, Chapter and Dossier tabs.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.recommendTabsFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("recommendTabsFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["recommendTabsFontSize"]) || 0.85,
			settings: s,
			group: tabsGroup,
			overrideFontKey: "recommendTabsOverrideFont",
			fontFamilyKey: "recommendTabsFontFamily",
			fontWeightKey: "recommendTabsFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		let tabsColourSetting!: Setting;
		let tabsActiveColourSetting!: Setting;
		tabsGroup
			.addSetting((setting) => {
				tabsColourSetting = setting;
				setting
					.setName("Tab colour")
					.setDesc("Colour of inactive tabs.")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.recommendTabsColor as string, (hex) => {
							void sfApi.updateLinkedSetting("recommendTabsColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				tabsActiveColourSetting = setting;
				setting
					.setName("Active tab colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.recommendTabsActiveColor as string, (hex) => {
							void sfApi.updateLinkedSetting("recommendTabsActiveColor", hex);
						}),
					);
			});
		colourSettings.push(tabsColourSetting, tabsActiveColourSetting);

		useHeaderColorToggle.onChange((value) => {
			void sfApi.updateLinkedSetting("recommendUseHeaderColorForAll", value).then(() => {
				applyUseHeaderColorVisibility(value);
			});
		});
	}

	/** Novel tab — cover title, subtitle, and the plot list's chapter names. */
	private renderContextNovelContent(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		colourSettings: Setting[],
	): void {
		const novelTitle = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "Novel title",
			sizeKey: "recommendNovelTitleFontSize",
			overrideFontKey: "recommendNovelTitleOverrideFont",
			fontFamilyKey: "recommendNovelTitleFontFamily",
			fontWeightKey: "recommendNovelTitleFontWeight",
			colorKey: "recommendNovelTitleColor",
			smallCapsKey: "recommendNovelTitleSmallCaps",
			mutedKey: "recommendNovelTitleMuted",
		});
		colourSettings.push(novelTitle.colorSetting);

		const novelSubtitle = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "Novel subtitle",
			sizeKey: "recommendNovelSubtitleFontSize",
			overrideFontKey: "recommendNovelSubtitleOverrideFont",
			fontFamilyKey: "recommendNovelSubtitleFontFamily",
			fontWeightKey: "recommendNovelSubtitleFontWeight",
			colorKey: "recommendNovelSubtitleColor",
			smallCapsKey: "recommendNovelSubtitleSmallCaps",
			mutedKey: "recommendNovelSubtitleMuted",
		});
		colourSettings.push(novelSubtitle.colorSetting);

		const plotChapter = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "Plot chapter name",
			sizeKey: "recommendPlotChapterFontSize",
			overrideFontKey: "recommendPlotChapterOverrideFont",
			fontFamilyKey: "recommendPlotChapterFontFamily",
			fontWeightKey: "recommendPlotChapterFontWeight",
			colorKey: "recommendPlotChapterColor",
			smallCapsKey: "recommendPlotChapterSmallCaps",
			mutedKey: "recommendPlotChapterMuted",
		});
		colourSettings.push(plotChapter.colorSetting);

		const sharedGroup = new SettingGroup(body);
		sharedGroup.setHeading("Shared styles");
		sharedGroup.addSetting((setting) => {
			setting
				.setName("Synopsis, plot notes and PoV / Location rows")
				.setDesc("Styled on the Chapter tab — the Novel pane reuses those styles.");
		});
	}

	/** Dossier tab — the search field, styled as the pane's header. */
	private renderContextDossierContent(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		colourSettings: Setting[],
	): void {
		const dossierHeader = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "Dossier search",
			sizeKey: "recommendDossierHeaderFontSize",
			overrideFontKey: "recommendDossierHeaderOverrideFont",
			fontFamilyKey: "recommendDossierHeaderFontFamily",
			fontWeightKey: "recommendDossierHeaderFontWeight",
			colorKey: "recommendDossierHeaderColor",
			smallCapsKey: "recommendDossierHeaderSmallCaps",
			mutedKey: "recommendDossierHeaderMuted",
		});
		colourSettings.push(dossierHeader.colorSetting);

		const sharedGroup = new SettingGroup(body);
		sharedGroup.setHeading("Shared styles");
		sharedGroup.addSetting((setting) => {
			setting
				.setName("Chapter headings and detail cards")
				.setDesc("Styled on the Chapter tab as section titles and details.");
		});
	}

	/** Chapter tab — chapter chrome plus the section, reference and detail styles shared with the other context panes. */
	private renderContextChapterContent(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		colourSettings: Setting[],
	): void {
		// Chapter title
		const chapterTitle = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "Chapter title",
			sizeKey: "recommendChapterTitleFontSize",
			overrideFontKey: "recommendChapterTitleOverrideFont",
			fontFamilyKey: "recommendChapterTitleFontFamily",
			fontWeightKey: "recommendChapterTitleFontWeight",
			colorKey: "recommendChapterTitleColor",
			smallCapsKey: "recommendChapterTitleSmallCaps",
			mutedKey: "recommendChapterTitleMuted",
		});
		colourSettings.push(chapterTitle.colorSetting);

		// Section titles (Characters in chapter, Details to capture, …)
		const sectionTitle = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "Section title",
			sizeKey: "recommendSectionTitleFontSize",
			overrideFontKey: "recommendSectionTitleOverrideFont",
			fontFamilyKey: "recommendSectionTitleFontFamily",
			fontWeightKey: "recommendSectionTitleFontWeight",
			colorKey: "recommendSectionTitleColor",
			smallCapsKey: "recommendSectionTitleSmallCaps",
			mutedKey: "recommendSectionTitleMuted",
		});
		colourSettings.push(sectionTitle.colorSetting);

		// PoV / Location labels ("PoV:", "Location:", "Default PoV:")
		const metaLabel = this.renderTitleStyleGroup(body, s, sfApi, sfHost, {
			labelPrefix: "PoV / Location label",
			sizeKey: "recommendMetaLabelFontSize",
			overrideFontKey: "recommendMetaLabelOverrideFont",
			fontFamilyKey: "recommendMetaLabelFontFamily",
			fontWeightKey: "recommendMetaLabelFontWeight",
			colorKey: "recommendMetaLabelColor",
			smallCapsKey: "recommendMetaLabelSmallCaps",
			mutedKey: "recommendMetaLabelMuted",
		});
		colourSettings.push(metaLabel.colorSetting);

		// PoV / Location selector (icon + character / place name)
		const metaControlGroup = new SettingGroup(body);
		metaControlGroup.setHeading("PoV / Location selector");
		metaControlGroup.addSetting((setting) => {
			setting
				.setName("Selector size")
				.setDesc("Text size of the icon and selected character / location name.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.recommendMetaControlFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("recommendMetaControlFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["recommendMetaControlFontSize"]) || 1,
			settings: s,
			group: metaControlGroup,
			overrideFontKey: "recommendMetaControlOverrideFont",
			fontFamilyKey: "recommendMetaControlFontFamily",
			fontWeightKey: "recommendMetaControlFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		let metaControlColourSetting!: Setting;
		metaControlGroup
			.addSetting((setting) => {
				metaControlColourSetting = setting;
				setting
					.setName("Selector colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.recommendMetaControlColor as string, (hex) => {
							void sfApi.updateLinkedSetting("recommendMetaControlColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override selector colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s.recommendMetaControlMuted as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting("recommendMetaControlMuted", value)),
					);
			});
		colourSettings.push(metaControlColourSetting);

		// Codex references / list rows
		const itemsGroup = new SettingGroup(body);
		itemsGroup.setHeading("Codex references");
		itemsGroup.addSetting((setting) => {
			setting
				.setName("Reference size")
				.setDesc("Text size of Codex reference rows (Characters in chapter, Other Codex references, …).")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.recommendItemsFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("recommendItemsFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["recommendItemsFontSize"]) || 1,
			settings: s,
			group: itemsGroup,
			overrideFontKey: "recommendItemsOverrideFont",
			fontFamilyKey: "recommendItemsFontFamily",
			fontWeightKey: "recommendItemsFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		let itemsColourSetting!: Setting;
		itemsGroup
			.addSetting((setting) => {
				itemsColourSetting = setting;
				setting
					.setName("Reference colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.recommendItemsColor as string, (hex) => {
							void sfApi.updateLinkedSetting("recommendItemsColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override reference colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s.recommendItemsMuted as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting("recommendItemsMuted", value)),
					);
			});
		colourSettings.push(itemsColourSetting);

		// Details to capture / hit cards
		const detailsGroup = new SettingGroup(body);
		detailsGroup.setHeading("Details to capture");
		detailsGroup.addSetting((setting) => {
			setting
				.setName("Details size")
				.setDesc("Text size of detail hits, facts, and related meta text, in both the Chapter and Dossier panes.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.recommendDetailsFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("recommendDetailsFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["recommendDetailsFontSize"]) || 0.9,
			settings: s,
			group: detailsGroup,
			overrideFontKey: "recommendDetailsOverrideFont",
			fontFamilyKey: "recommendDetailsFontFamily",
			fontWeightKey: "recommendDetailsFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		let detailsColourSetting!: Setting;
		detailsGroup
			.addSetting((setting) => {
				detailsColourSetting = setting;
				setting
					.setName("Details colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.recommendDetailsColor as string, (hex) => {
							void sfApi.updateLinkedSetting("recommendDetailsColor", hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override details colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s.recommendDetailsMuted as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting("recommendDetailsMuted", value)),
					);
			});
		colourSettings.push(detailsColourSetting);

		// Synopsis
		const synopsisGroup = new SettingGroup(body);
		synopsisGroup.setHeading("Synopsis");
		synopsisGroup.addSetting((setting) => {
			setting
				.setName("Synopsis size")
				.setDesc("Text size of the chapter summary, novel synopsis, and plot notes.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s.recommendSynopsisFontSize as number)
						.onChange((value) => void sfApi.updateLinkedSetting("recommendSynopsisFontSize", value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()["recommendSynopsisFontSize"]) || 1,
			settings: s,
			group: synopsisGroup,
			overrideFontKey: "recommendSynopsisOverrideFont",
			fontFamilyKey: "recommendSynopsisFontFamily",
			fontWeightKey: "recommendSynopsisFontWeight",
			restyle: () => sfApi.applyLinkedStyles(),
		});
		let synopsisColourSetting!: Setting;
		synopsisGroup.addSetting((setting) => {
			synopsisColourSetting = setting;
			setting
				.setName("Synopsis colour")
				.addButton((button) =>
					bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s.recommendSynopsisColor as string, (hex) => {
						void sfApi.updateLinkedSetting("recommendSynopsisColor", hex);
					}),
				);
		});
		colourSettings.push(synopsisColourSetting);
	}

	private renderRightRailPanelContent(
		body: HTMLElement,
		s: Record<string, unknown>,
		sfApi: SfFormattingApi,
		sfHost: FontCardHost,
		panel: "archive",
	): void {
		const keys = {
			sizeKey: "archiveHeaderFontSize" as const,
			overrideFontKey: "archiveHeaderOverrideFont" as const,
			fontFamilyKey: "archiveHeaderFontFamily" as const,
			fontWeightKey: "archiveHeaderFontWeight" as const,
			colorKey: "archiveHeaderColor" as const,
			mutedKey: "archiveHeaderMuted" as const,
			smallCapsKey: "archiveHeaderSmallCaps" as const,
			useHeaderColorForAllKey: "archiveUseHeaderColorForAll" as const,
			itemsSizeKey: "archiveItemsFontSize" as const,
			itemsOverrideFontKey: "archiveItemsOverrideFont" as const,
			itemsFontFamilyKey: "archiveItemsFontFamily" as const,
			itemsFontWeightKey: "archiveItemsFontWeight" as const,
			itemsColorKey: "archiveItemsColor" as const,
			itemsMutedKey: "archiveItemsMuted" as const,
			highlightColorKey: "archiveHighlightColor" as const,
			highlightTextColorKey: "archiveHighlightTextColor" as const,
			itemsLabel: "Archive items",
		};

		const useHeaderColorToggle = this.renderHeaderStyleGroup(body, s, sfApi, sfHost, {
			sizeKey: keys.sizeKey,
			overrideFontKey: keys.overrideFontKey,
			fontFamilyKey: keys.fontFamilyKey,
			fontWeightKey: keys.fontWeightKey,
			colorKey: keys.colorKey,
			mutedKey: keys.mutedKey,
			smallCapsKey: keys.smallCapsKey,
			useHeaderColorForAllKey: keys.useHeaderColorForAllKey,
		});

		const itemsGroup = new SettingGroup(body);
		let itemsColourSetting!: Setting;
		itemsGroup.addSetting((setting) => {
			setting
				.setName(keys.itemsLabel)
				.setDesc("Text size of list items, from 0.5em to 1.5em.")
				.addSlider((slider) =>
					slider
						.setLimits(0.5, 1.5, 0.1)
						.setValue(s[keys.itemsSizeKey] as number)
						.onChange((value) => void sfApi.updateLinkedSetting(keys.itemsSizeKey, value)),
				);
		});
		renderCustomFontCard({
			host: sfHost,
			app: this.app,
			previewFontSizeEm: () => Number(sfHost.getSettings()[keys.itemsSizeKey]) || 1,
			settings: s,
			group: itemsGroup,
			overrideFontKey: keys.itemsOverrideFontKey,
			fontFamilyKey: keys.itemsFontFamilyKey,
			fontWeightKey: keys.itemsFontWeightKey,
			restyle: () => sfApi.applyLinkedStyles(),
		});
		itemsGroup
			.addSetting((setting) => {
				itemsColourSetting = setting;
				setting
					.setName(`${keys.itemsLabel} colour`)
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s[keys.itemsColorKey] as string, (hex) => {
							void sfApi.updateLinkedSetting(keys.itemsColorKey, hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Muted")
					.setDesc("Override colour with muted colour.")
					.addToggle((toggle) =>
						toggle
							.setValue(s[keys.itemsMutedKey] as boolean)
							.onChange((value) => void sfApi.updateLinkedSetting(keys.itemsMutedKey, value)),
					);
			});

		const highlightGroup = new SettingGroup(body);
		let highlightColourSetting!: Setting;
		highlightGroup
			.addSetting((setting) => {
				highlightColourSetting = setting;
				setting
					.setName("Highlight colour")
					.setDesc("Background colour for the selected item.")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s[keys.highlightColorKey] as string, (hex) => {
							void sfApi.updateLinkedSetting(keys.highlightColorKey, hex);
						}),
					);
			})
			.addSetting((setting) => {
				setting
					.setName("Highlight text colour")
					.addButton((button) =>
						bindColorSwatchButton(this.app, () => this.plugin.getPalette(), button.buttonEl, s[keys.highlightTextColorKey] as string, (hex) => {
							void sfApi.updateLinkedSetting(keys.highlightTextColorKey, hex);
						}),
					);
			});

		const applyUseHeaderColorVisibility = (hidden: boolean) => {
			itemsColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
			highlightColourSetting.settingEl.toggleClass("sf-settings-hidden", hidden);
		};
		useHeaderColorToggle.onChange((value) => {
			void sfApi.updateLinkedSetting(keys.useHeaderColorForAllKey, value).then(() => {
				applyUseHeaderColorVisibility(value);
			});
		});
		applyUseHeaderColorVisibility(s[keys.useHeaderColorForAllKey] as boolean);
	}

	private renderSeriesPaneContent(body: HTMLElement, s: Record<string, unknown>, sfApi: SfFormattingApi): void {
		const seriesGroup = new SettingGroup(body);
		seriesGroup.addSetting((setting) => {
			setting
				.setName("Hide series pane")
				.setDesc("Hides the series header and locks storyForge to book view — for standalone/non-series projects.")
				.addToggle((toggle) =>
					toggle
						.setValue(s.hideSeriesPane as boolean)
						.onChange((value) => void sfApi.updateLinkedSetting("hideSeriesPane", value)),
				);
		});
	}
}
