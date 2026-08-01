import { App, PluginSettingTab, SettingGroup } from "obsidian";
import type FormatForgePlugin from "../main";
import type { SfFormattingApi } from "../storyforgeBridge";
import { PALETTE_NAMES, resolvePaletteVariant, type PaletteName } from "../colorPalettes";

export class FormatForgeSettingsTab extends PluginSettingTab {
	private plugin: FormatForgePlugin;
	private sfApi: SfFormattingApi | null;

	constructor(app: App, plugin: FormatForgePlugin, sfApi: SfFormattingApi | null) {
		super(app, plugin);
		this.plugin = plugin;
		this.sfApi = sfApi;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("sf-settings-tab");

		containerEl.createEl("p", {
			text: "formatForge manages the typography settings for storyForge — editor colours, fonts, heading dividers, and the full formatting interface. Requires storyForge.",
			cls: "ff-settings-description",
		});

		if (!this.sfApi) {
			containerEl.createEl("p", {
				text: "storyForge is not detected. Install and enable storyForge, then reload Obsidian.",
				cls: "ff-no-sf-notice",
			});
		}

		// ── Formatting modals ──────────────────────────────────────
		new SettingGroup(containerEl)
			.setHeading("Formatting")
			.addSetting((s) => {
				s.setName("Text styling")
					.setDesc("Editor body and heading colours, fonts, dividers, and font sizes.")
					.addButton((btn) =>
						btn.setButtonText("Open").setCta().onClick(() => {
							void import("./TextStyleModal").then(({ TextStyleModal }) => {
								new TextStyleModal(this.app, this.plugin, this.sfApi).open();
							});
						}),
					);
			})
			.addSetting((s) => {
				s.setName("storyForge interface")
					.setDesc("storyForge panel chrome: library, unplaced, codex, cycling guide, highlights, scrollbar.")
					.addButton((btn) =>
						btn.setButtonText("Open").onClick(() => {
							void import("./UiFormattingModal").then(({ UiFormattingModal }) => {
								new UiFormattingModal(this.app, this.plugin, this.sfApi).open();
							});
						}),
					);
			});

		// ── Palette ────────────────────────────────────────────────
		const sfApi = this.sfApi;
		if (sfApi) {
			this.renderPaletteSection(containerEl, sfApi);
		}
	}

	private renderPaletteSection(containerEl: HTMLElement, sfApi: SfFormattingApi): void {
		const palette = sfApi.getPalette();

		const group = new SettingGroup(containerEl);
		group.setHeading("Colour palette");

		// Palette name
		group.addSetting((s) => {
			s.setName("Palette")
				.setDesc("Base palette for colour pickers across all storyForge formatting.")
				.addDropdown((dropdown) => {
					for (const name of PALETTE_NAMES) {
						dropdown.addOption(name, name);
					}
					dropdown.setValue(palette.name);
					dropdown.onChange((value) => {
						void sfApi.updatePalette({ name: value }).then(() => {
							// Refresh the whole tab so variant dropdown updates
							void Promise.resolve().then(() => this.display());
						});
					});
				});
		});

		// Palette variant (only for preset palettes)
		if (palette.name !== "Custom") {
			const variants = this.getVariantsForPalette(palette.name as PaletteName);
			if (variants.length > 0) {
				group.addSetting((s) => {
					s.setName("Variant")
						.setDesc("Light or dark variant of the selected palette.")
						.addDropdown((dropdown) => {
							for (const v of variants) {
								dropdown.addOption(v.name, `${v.name} (${v.appearance})`);
							}
							const currentVariant = palette.variant;
							dropdown.setValue(variants.some((v) => v.name === currentVariant) ? currentVariant : variants[0].name);
							dropdown.onChange((value) => {
								void sfApi.updatePalette({ variant: value });
							});
						});
				});
			}
		}
	}

	private getVariantsForPalette(paletteName: PaletteName): Array<{ name: string; appearance: string }> {
		if (paletteName === "Custom") return [];
		const candidateNames = [
			"Light", "Dark", "Latte", "Frappé", "Macchiato", "Mocha",
			"Dawn", "Moon", "Rise",
			"Dark Hard", "Dark Medium", "Dark Soft",
			"Light Hard", "Light Medium", "Light Soft",
			"Dark (Original)", "Light (Original)",
		];
		const variants: Array<{ name: string; appearance: string }> = [];
		for (const n of candidateNames) {
			const v = resolvePaletteVariant(paletteName, n);
			if (v) variants.push({ name: v.name, appearance: v.appearance });
		}
		return variants;
	}
}
