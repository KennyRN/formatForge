import { App, Modal } from "obsidian";
import { CUSTOM_FONTS, registerCustomFontFaces, type CustomFontEntry } from "../fonts";
import { weightNameFor, weightPreviewLabel } from "./fontPickerUtils";

export type FontPickerSelectHandler = (fontId: string) => void | Promise<void>;

/** Appends a "Theme default" choice after every real font, for callers with an override concept. */
export interface FontPickerThemeDefaultOption {
	isActive: boolean;
	onSelect: () => void | Promise<void>;
}

/**
 * Alphabetised font catalogue in three columns: thinnest weight name | face name
 * (normal) | heaviest weight name. Fixed-weight faces (e.g. Courier Prime) show
 * only the face name in the centre column. When `themeDefault` is supplied, a
 * "Theme default" row is appended at the very bottom, after every real font.
 */
export class FontPickerModal extends Modal {
	constructor(
		app: App,
		private selectedId: string,
		private previewFontSizeEm: number,
		private onSelect: FontPickerSelectHandler,
		private themeDefault?: FontPickerThemeDefaultOption,
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
		const fonts = [...CUSTOM_FONTS].sort((a, b) => a.label.localeCompare(b.label));

		for (const font of fonts) {
			this.renderFontRow(list, font, sizeEm);
		}
		if (this.themeDefault) this.renderThemeDefaultRow(list, this.themeDefault);
	}

	private renderThemeDefaultRow(list: HTMLElement, themeDefault: FontPickerThemeDefaultOption): void {
		const row = list.createDiv({ cls: "ff-font-picker-row ff-font-picker-theme-default" });
		if (themeDefault.isActive) row.addClass("is-selected");
		row.createDiv({ cls: "ff-font-picker-cell is-min" });
		row.createSpan({ cls: "ff-font-picker-sample ff-font-picker-cell is-normal", text: "Theme default" });
		row.createDiv({ cls: "ff-font-picker-cell is-max" });
		row.addEventListener("click", () => {
			void this.chooseThemeDefault(themeDefault);
		});
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
