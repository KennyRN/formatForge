import { App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type FormatForgePlugin from "../main";
import type { SfFormattingApi } from "../storyforgeBridge";
import {
	COLOR_PALETTES,
	defaultVariantName,
	PALETTE_NAMES,
	type PresetPaletteName,
} from "../colorPalettes";
import { TextStyleModal } from "./TextStyleModal";
import { UiFormattingModal } from "./UiFormattingModal";

function isPresetPaletteName(name: string): name is PresetPaletteName {
	return name in COLOR_PALETTES;
}

/**
 * Declarative settings for Obsidian 1.13+ (`minAppVersion`).
 * Palette controls are bridged to storyForge via {@link SfFormattingApi}.
 */
export class FormatForgeSettingsTab extends PluginSettingTab {
	private plugin: FormatForgePlugin;
	private sfApi: SfFormattingApi | null;

	constructor(app: App, plugin: FormatForgePlugin, sfApi: SfFormattingApi | null) {
		super(app, plugin);
		this.plugin = plugin;
		this.sfApi = sfApi;
	}

	getControlValue(key: string): unknown {
		if (key === "colorPaletteName") {
			return this.sfApi?.getPalette().name ?? "Custom";
		}
		if (key === "colorPaletteVariant") {
			return this.sfApi?.getPalette().variant ?? "";
		}
		return super.getControlValue(key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (!this.sfApi) return;

		if (key === "colorPaletteName") {
			const name = String(value);
			await this.sfApi.updatePalette({ name });
			if (isPresetPaletteName(name)) {
				const appearance = document.body.classList.contains("theme-dark") ? "dark" : "light";
				await this.sfApi.updatePalette({
					variant: defaultVariantName(COLOR_PALETTES[name], appearance),
				});
			}
			// Variant dropdown options depend on the selected palette.
			this.update();
			return;
		}

		if (key === "colorPaletteVariant") {
			await this.sfApi.updatePalette({ variant: String(value) });
			return;
		}

		await super.setControlValue(key, value);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const palette = this.sfApi?.getPalette();
		const paletteOptions = Object.fromEntries(PALETTE_NAMES.map((name) => [name, name]));
		const selectedName = palette?.name ?? "";
		const variantOptions =
			isPresetPaletteName(selectedName)
				? Object.fromEntries(
						COLOR_PALETTES[selectedName].map((v) => [v.name, `${v.name} (${v.appearance})`]),
					)
				: {};

		return [
			{
				name: "About formatForge",
				desc: "formatForge manages the typography settings for storyForge — editor colours, fonts, heading dividers, and the full formatting interface. Requires storyForge.",
				searchable: false,
			},
			{
				name: "storyForge not detected",
				desc: "Install and enable storyForge, then reload Obsidian.",
				visible: () => !this.sfApi,
				searchable: false,
			},
			{
				type: "group",
				heading: "Formatting",
				items: [
					{
						name: "Text styling",
						desc: "Editor body and heading colours, fonts, dividers, and font sizes.",
						action: () => {
							new TextStyleModal(this.app, this.plugin, this.sfApi).open();
						},
					},
					{
						name: "storyForge interface",
						desc: "storyForge panel chrome: library, unplaced, codex, cycling guide, highlights, scrollbar.",
						action: () => {
							new UiFormattingModal(this.app, this.plugin, this.sfApi).open();
						},
					},
				],
			},
			{
				type: "group",
				heading: "Colour palette",
				visible: () => !!this.sfApi,
				items: [
					{
						name: "Palette",
						desc: "Base palette for colour pickers across all storyForge formatting.",
						control: {
							type: "dropdown",
							key: "colorPaletteName",
							options: paletteOptions,
						},
					},
					{
						name: "Variant",
						desc: "Light or dark variant of the selected palette.",
						visible: () => {
							const name = this.sfApi?.getPalette().name ?? "";
							return isPresetPaletteName(name) && COLOR_PALETTES[name].length > 0;
						},
						control: {
							type: "dropdown",
							key: "colorPaletteVariant",
							options: variantOptions,
						},
					},
				],
			},
		];
	}
}
