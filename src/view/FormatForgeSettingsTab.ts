import { App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type FormatForgePlugin from "../main";
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
 * Palette / Forge-panel controls appear when storyForge is available.
 */
export class FormatForgeSettingsTab extends PluginSettingTab {
	private plugin: FormatForgePlugin;

	constructor(app: App, plugin: FormatForgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getControlValue(key: string): unknown {
		const sfApi = this.plugin.getStoryForgeApi();
		if (key === "colorPaletteName") {
			return sfApi?.getPalette().name ?? "Custom";
		}
		if (key === "colorPaletteVariant") {
			return sfApi?.getPalette().variant ?? "";
		}
		return super.getControlValue(key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const sfApi = this.plugin.getStoryForgeApi();
		if (!sfApi) return;

		if (key === "colorPaletteName") {
			const name = String(value);
			await sfApi.updatePalette({ name });
			if (isPresetPaletteName(name)) {
				const appearance = document.body.classList.contains("theme-dark") ? "dark" : "light";
				await sfApi.updatePalette({
					variant: defaultVariantName(COLOR_PALETTES[name], appearance),
				});
			}
			// Variant dropdown options depend on the selected palette.
			this.update();
			return;
		}

		if (key === "colorPaletteVariant") {
			await sfApi.updatePalette({ variant: String(value) });
			return;
		}

		await super.setControlValue(key, value);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const sfApi = this.plugin.getStoryForgeApi();
		const palette = sfApi?.getPalette();
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
				desc: "Simple typography and colour formatting for Obsidian notes. Works on its own, and also styles companions in the Forge plugin family (storyForge, timelineForge, and others as they adopt the formatting API).",
				searchable: false,
			},
			{
				type: "group",
				heading: "Formatting",
				items: [
					{
						name: "Text styling",
						desc: "Editor body and heading colours, fonts, dividers, and (when a Forge host provides them) font sizes.",
						action: () => {
							new TextStyleModal(this.app, this.plugin, this.plugin.getStoryForgeApi()).open();
						},
					},
					{
						name: "Forge interface",
						desc: "Panel chrome for Forge hosts that register with formatForge (for example storyForge library, unplaced, codex, guides, scrollbar).",
						visible: () => !!this.plugin.getStoryForgeApi(),
						action: () => {
							new UiFormattingModal(this.app, this.plugin, this.plugin.getStoryForgeApi()).open();
						},
					},
				],
			},
			{
				type: "group",
				heading: "Colour palette",
				visible: () => !!this.plugin.getStoryForgeApi(),
				items: [
					{
						name: "Palette",
						desc: "Base palette for colour pickers across Forge formatting UI.",
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
							const name = this.plugin.getStoryForgeApi()?.getPalette().name ?? "";
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
