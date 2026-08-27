import { App, Modal, Setting } from "obsidian";
import type FormatForgePlugin from "../main";
import { COLOR_PALETTES, defaultVariantName, PALETTE_NAMES, type PresetPaletteName } from "../colorPalettes";
import { TextStyleModal } from "./TextStyleModal";
import { FormattingExportModal } from "./FormattingExportModal";

function isPresetPaletteName(name: string): name is PresetPaletteName {
	return name in COLOR_PALETTES;
}

/**
 * Combined "settings window" modal for formatForge — Text styling / Formatting themes launchers
 * plus the palette controls, all in one modal instead of scattered across Obsidian's Settings
 * window. This is the same content FormatForgeSettingsTab renders declaratively, reproduced here
 * imperatively so it can be opened as a modal. Opened both from that tab's own rows and from
 * storyForge's companion bridge (registerCompanion's `openFormattingModal` hook in main.ts) when
 * formatForge is the active host — see storyForge's SeriesModal.ts formatting tab.
 */
export class FormatForgeSettingsModal extends Modal {
	constructor(
		app: App,
		private plugin: FormatForgePlugin,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("ff-settings-modal");
		this.titleEl.remove();
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		const plugin = this.plugin;
		const palette = plugin.getPalette();

		new Setting(contentEl)
			.setName("Text styling")
			.setDesc("Editor body and heading colours, fonts, sizes, dividers, and manuscript scrollbar.")
			.addButton((btn) =>
				btn
					.setButtonText("Open")
					.onClick(() => new TextStyleModal(this.app, plugin, plugin.getStoryForgeApi()).open()),
			);

		new Setting(contentEl)
			.setName("Formatting themes")
			.setDesc("Save, preview, and apply named themes, or share formatting as JSON.")
			.addButton((btn) =>
				btn.setButtonText("Open").onClick(() => new FormattingExportModal(this.app, plugin).open()),
			);

		const paletteOptions = Object.fromEntries(PALETTE_NAMES.map((name) => [name, name]));
		new Setting(contentEl)
			.setName("Palette")
			.setDesc(
				"Base palette for colour pickers in formatting UI. Stored in formatForge when alone; shared with storyForge when that host is present.",
			)
			.addDropdown((dd) =>
				dd
					.addOptions(paletteOptions)
					.setValue(palette.name)
					.onChange(async (name) => {
						await plugin.updatePalette({ name });
						if (isPresetPaletteName(name)) {
							const appearance = document.body.classList.contains("theme-dark") ? "dark" : "light";
							await plugin.updatePalette({ variant: defaultVariantName(COLOR_PALETTES[name], appearance) });
						}
						this.render();
					}),
			);

		if (isPresetPaletteName(palette.name) && COLOR_PALETTES[palette.name].length > 1) {
			const variantOptions = Object.fromEntries(
				COLOR_PALETTES[palette.name].map((v) => [v.name, `${v.name} (${v.appearance})`]),
			);
			new Setting(contentEl)
				.setName("Variant")
				.setDesc("Light or dark variant of the selected palette.")
				.addDropdown((dd) =>
					dd
						.addOptions(variantOptions)
						.setValue(palette.variant)
						.onChange((value) => void plugin.updatePalette({ variant: value })),
				);
		}

		if (palette.name === "Custom") {
			palette.customColors.forEach((color, i) => {
				new Setting(contentEl).setName(`Custom colour ${i + 1} name`).addText((text) =>
					text
						.setPlaceholder("Name")
						.setValue(color.name)
						.onChange((value) => {
							const colors = palette.customColors.map((c) => ({ ...c }));
							colors[i] = { ...colors[i], name: value };
							void plugin.updatePalette({ customColors: colors });
						}),
				);
				new Setting(contentEl).setName(`Custom colour ${i + 1}`).addColorPicker((picker) =>
					picker.setValue(color.hex).onChange((value) => {
						const colors = palette.customColors.map((c) => ({ ...c }));
						colors[i] = { ...colors[i], hex: value };
						void plugin.updatePalette({ customColors: colors });
					}),
				);
			});
		}
	}
}
