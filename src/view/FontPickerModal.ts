import { App, Modal, Setting } from "obsidian";
import { CUSTOM_FONTS, registerCustomFontFaces, type CustomFontEntry } from "../fonts";
import { displayNameFromComputedFontFamily, weightNameFor, weightPreviewLabel } from "./fontPickerUtils";

export type FontPickerSelectHandler = (fontId: string) => void | Promise<void>;

/** Appends a "Theme default" choice after every real font, for callers with an override concept. */
export interface FontPickerThemeDefaultOption {
	isActive: boolean;
	onSelect: () => void | Promise<void>;
	/** CSS `font-family` used to preview the theme-default row. */
	previewFamily?: string;
}

/** Small-caps toggle inside the picker; samples update live. */
export interface FontPickerSmallCapsOption {
	enabled: boolean;
	onChange: (enabled: boolean) => void | Promise<void>;
}

/**
 * Alphabetised font catalogue in three columns: thinnest weight name | face name
 * (normal) | heaviest weight name. Fixed-weight faces (e.g. Courier Prime) show
 * only the face name in the centre column. When `themeDefault` is supplied, a
 * theme-default row is appended at the very bottom, previewed in the actual
 * default face. When `smallCaps` is supplied, a toggle above the list applies
 * small-caps to every sample live.
 */
export class FontPickerModal extends Modal {
	constructor(
		app: App,
		private selectedId: string,
		private previewFontSizeEm: number,
		private onSelect: FontPickerSelectHandler,
		private themeDefault?: FontPickerThemeDefaultOption,
		private smallCaps?: FontPickerSmallCapsOption,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("ff-font-picker-modal");
		this.titleEl.remove();
		this.modalEl.querySelector(".modal-close-button")?.remove();
		void registerCustomFontFaces(document).then(() => this.render());
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ff-font-picker-modal");

		const sizeEm = Number.isFinite(this.previewFontSizeEm) && this.previewFontSizeEm > 0 ? this.previewFontSizeEm : 1;
		const list = contentEl.createDiv({ cls: "ff-font-picker-list" });
		if (this.smallCaps?.enabled) list.addClass("is-small-caps");

		if (this.smallCaps) {
			const toolbar = contentEl.createDiv({ cls: "ff-font-picker-toolbar" });
			contentEl.insertBefore(toolbar, list);
			new Setting(toolbar)
				.setName("Small caps")
				.addToggle((toggle) => {
					toggle.setValue(this.smallCaps!.enabled).onChange((value) => {
						this.smallCaps!.enabled = value;
						list.toggleClass("is-small-caps", value);
						void this.smallCaps!.onChange(value);
					});
				}).nameEl.addClass("sf-small-caps-label");
		}

		const fonts = [...CUSTOM_FONTS].sort((a, b) => a.label.localeCompare(b.label));

		for (const font of fonts) {
			this.renderFontRow(list, font, sizeEm);
		}
		if (this.themeDefault) this.renderThemeDefaultRow(list, this.themeDefault, sizeEm);
	}

	private renderThemeDefaultRow(list: HTMLElement, themeDefault: FontPickerThemeDefaultOption, sizeEm: number): void {
		const row = list.createDiv({ cls: "ff-font-picker-row ff-font-picker-theme-default" });
		if (themeDefault.isActive) row.addClass("is-selected");
		row.setCssStyles({ fontSize: `${sizeEm}em` });
		const family = themeDefault.previewFamily ?? "var(--font-interface)";

		this.renderThemeSample(row, family, 300, weightNameFor(300), "is-min");
		const nameSample = this.renderThemeSample(row, family, 400, "Theme default", "is-normal");
		this.renderThemeSample(row, family, 700, weightNameFor(700), "is-max");

		const computed = nameSample.ownerDocument.defaultView?.getComputedStyle(nameSample).fontFamily ?? "";
		nameSample.setText(displayNameFromComputedFontFamily(computed));
		nameSample.setAttr("title", "Theme default");

		row.addEventListener("click", () => {
			void this.chooseThemeDefault(themeDefault);
		});
	}

	private renderThemeSample(
		row: HTMLElement,
		family: string,
		weight: number,
		text: string,
		slotClass: "is-min" | "is-normal" | "is-max",
	): HTMLElement {
		const sample = row.createSpan({
			cls: `ff-font-picker-sample ff-font-picker-cell ${slotClass}`,
			text,
		});
		sample.setCssStyles({
			fontFamily: family,
			fontWeight: String(weight),
			fontStyle: "normal",
		});
		return sample;
	}

	private async chooseThemeDefault(themeDefault: FontPickerThemeDefaultOption): Promise<void> {
		await themeDefault.onSelect();
		this.close();
	}

	private renderFontRow(list: HTMLElement, font: CustomFontEntry, sizeEm: number): void {
		const row = list.createDiv({ cls: "ff-font-picker-row" });
		if (font.id === this.selectedId) {
			row.addClass("is-selected");
		}
		row.setCssStyles({ fontSize: `${sizeEm}em` });

		const fixed = font.weightMin === font.weightMax;
		const normal = fixed ? font.weightMin : Math.max(font.weightMin, Math.min(400, font.weightMax));

		if (fixed) {
			row.createDiv({ cls: "ff-font-picker-cell is-min" });
			this.renderSample(row, font, normal, font.label, "is-normal");
			row.createDiv({ cls: "ff-font-picker-cell is-max" });
		} else {
			this.renderSample(row, font, font.weightMin, weightNameFor(font.weightMin), "is-min");
			this.renderSample(row, font, normal, font.label, "is-normal");
			this.renderSample(row, font, font.weightMax, weightNameFor(font.weightMax), "is-max");
		}

		row.addEventListener("click", () => {
			void this.choose(font.id);
		});
	}

	private renderSample(
		row: HTMLElement,
		font: CustomFontEntry,
		weight: number,
		text: string,
		slotClass: "is-min" | "is-normal" | "is-max",
	): void {
		const sample = row.createSpan({
			cls: `ff-font-picker-sample ff-font-picker-cell ${slotClass}`,
			text,
		});
		if (font.weightMin === font.weightMax) {
			sample.setCssStyles({
				fontFamily: `"${font.cssFontFamily}", var(--font-text)`,
				fontWeight: String(font.weightMin),
				fontVariationSettings: "normal",
			});
		} else {
			sample.setCssStyles({
				fontFamily: `"${font.cssFontFamily}", var(--font-text)`,
				fontWeight: String(weight),
				fontVariationSettings: `"wght" ${weight}`,
			});
		}
		sample.setAttr("title", weightPreviewLabel(weight, font));
	}

	private async choose(fontId: string): Promise<void> {
		await this.onSelect(fontId);
		this.close();
	}
}

export { weightNameFor } from "./fontPickerUtils";
