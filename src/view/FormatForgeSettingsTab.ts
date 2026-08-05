import { App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type FormatForgePlugin from "../main";
import {
	COLOR_PALETTES,
	defaultVariantName,
	PALETTE_NAMES,
	type PresetPaletteName,
} from "../colorPalettes";
import { FormattingExportModal } from "./FormattingExportModal";
import { TextStyleModal } from "./TextStyleModal";
import { UiFormattingModal } from "./UiFormattingModal";

function isPresetPaletteName(name: string): name is PresetPaletteName {
	return name in COLOR_PALETTES;
}

const CUSTOM_COLOR_KEY = /^customPaletteColors\.(\d+)\.(name|hex)$/;

/**
 * Declarative settings for Obsidian 1.13+ (`minAppVersion`).
 * Palette is always available; Forge-panel chrome appears when storyForge is linked.
 */
export class FormatForgeSettingsTab extends PluginSettingTab {
	private plugin: FormatForgePlugin;

	constructor(app: App, plugin: FormatForgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getControlValue(key: string): unknown {
		if (key === "colorPaletteName") {
			return this.plugin.getPalette().name;
		}
		if (key === "colorPaletteVariant") {
			return this.plugin.getPalette().variant;
		}
		const customMatch = CUSTOM_COLOR_KEY.exec(key);
		if (customMatch) {
			const index = Number(customMatch[1]);
			const field = customMatch[2] as "name" | "hex";
			return this.plugin.getPalette().customColors[index]?.[field] ?? "";
		}
		return super.getControlValue(key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (key === "colorPaletteName") {
			const name = String(value);
			await this.plugin.updatePalette({ name });
			if (isPresetPaletteName(name)) {
				const appearance = document.body.classList.contains("theme-dark") ? "dark" : "light";
				await this.plugin.updatePalette({
					variant: defaultVariantName(COLOR_PALETTES[name], appearance),
				});
			}
			// Variant / Custom colour rows depend on the selected palette.
			this.update();
			return;
		}

		if (key === "colorPaletteVariant") {
			await this.plugin.updatePalette({ variant: String(value) });
			return;
		}

		const customMatch = CUSTOM_COLOR_KEY.exec(key);
		if (customMatch) {
			const index = Number(customMatch[1]);
			const field = customMatch[2] as "name" | "hex";
			const colors = this.plugin.getPalette().customColors.map((c) => ({ ...c }));
			const existing = colors[index];
			if (!existing) return;
			colors[index] = { ...existing, [field]: String(value) };
			await this.plugin.updatePalette({ customColors: colors });
			return;
		}

		await super.setControlValue(key, value);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const palette = this.plugin.getPalette();
		const paletteOptions = Object.fromEntries(PALETTE_NAMES.map((name) => [name, name]));
		const selectedName = palette.name;
		const colorCount = palette.customColors.length;
		const variantOptions =
			isPresetPaletteName(selectedName)
				? Object.fromEntries(
						COLOR_PALETTES[selectedName].map((v) => [v.name, `${v.name} (${v.appearance})`]),
					)
				: {};

		return [
			{
				type: "group",
				items: [
					{
						name: "Text styling",
						desc: "Editor body and heading colours, fonts, sizes, dividers, and manuscript scrollbar.",
						action: () => {
							new TextStyleModal(this.app, this.plugin, this.plugin.getStoryForgeApi()).open();
						},
					},
					{
						name: "storyForge interface",
						desc: "Panel chrome for storyForge library, unplaced, codex, and cycling guide.",
						visible: () => !!this.plugin.getStoryForgeApi(),
						action: () => {
							new UiFormattingModal(this.app, this.plugin, this.plugin.getStoryForgeApi()).open();
						},
					},
					{
						name: "Formatting themes",
						desc: "Save, preview, and apply named themes, or share formatting as JSON.",
						action: () => {
							new FormattingExportModal(this.app, this.plugin).open();
						},
					},
				],
			},
			{
				type: "group",
				items: [
					{
						name: "Palette",
						desc: "Base palette for colour pickers in formatting UI. Stored in formatForge when alone; shared with storyForge when that host is present.",
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
							const name = this.plugin.getPalette().name;
							return isPresetPaletteName(name) && COLOR_PALETTES[name].length > 0;
						},
						control: {
							type: "dropdown",
							key: "colorPaletteVariant",
							options: variantOptions,
						},
					},
					...Array.from({ length: colorCount }, (_, i) => [
						{
							name: `Custom colour ${i + 1} name`,
							visible: () => this.plugin.getPalette().name === "Custom",
							control: {
								type: "text" as const,
								key: `customPaletteColors.${i}.name`,
								placeholder: "Name",
							},
						},
						{
							name: `Custom colour ${i + 1}`,
							visible: () => this.plugin.getPalette().name === "Custom",
							control: {
								type: "color" as const,
								key: `customPaletteColors.${i}.hex`,
							},
						},
					]).flat(),
				],
			},
		];
	}
}
