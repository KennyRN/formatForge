import { App, Modal, setIcon } from "obsidian";
import { CUSTOM_FONTS, type CustomFontEntry } from "../fonts";
import { previewWeightsFor, weightPreviewLabel } from "./fontPickerUtils";

export type FontPickerSelectHandler = (fontId: string) => void | Promise<void>;

/**
 * Alphabetised font catalogue: each row shows the face name set in that font,
 * with weight samples (min / normal / max for variable faces; normal only for
 * fixed-weight faces). Preview size defaults to 1em, or the caller's region size.
 */
export class FontPickerModal extends Modal {
	constructor(
		app: App,
		private selectedId: string,
		private previewFontSizeEm: number,
		private onSelect: FontPickerSelectHandler,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("ff-font-picker-modal");
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ff-font-picker-modal");

		contentEl.createEl("h2", { text: "Pick font" });

		const sizeEm = Number.isFinite(this.previewFontSizeEm) && this.previewFontSizeEm > 0 ? this.previewFontSizeEm : 1;
		const list = contentEl.createDiv({ cls: "ff-font-picker-list" });
		const fonts = [...CUSTOM_FONTS].sort((a, b) => a.label.localeCompare(b.label));

		for (const font of fonts) {
			this.renderFontRow(list, font, sizeEm);
		}
	}

	private renderFontRow(list: HTMLElement, font: CustomFontEntry, sizeEm: number): void {
		const row = list.createDiv({ cls: "ff-font-picker-row sf-row" });
		if (font.id === this.selectedId) {
			row.addClass("is-selected");
		}

		const previews = row.createDiv({ cls: "ff-font-picker-previews" });
		previews.style.fontSize = `${sizeEm}em`;

		const weights = previewWeightsFor(font);
		for (const weight of weights) {
			const sample = previews.createSpan({ cls: "ff-font-picker-sample", text: font.label });
			sample.style.fontFamily = `"${font.cssFontFamily}", var(--font-text)`;
			if (font.weightMin === font.weightMax) {
				sample.style.fontWeight = String(font.weightMin);
				sample.style.fontVariationSettings = "normal";
			} else {
				sample.style.fontWeight = String(weight);
				sample.style.fontVariationSettings = `"wght" ${weight}`;
			}
			sample.setAttr("title", weightPreviewLabel(weight, font));
		}

		const selectBtn = row.createEl("button", {
			cls: "ff-font-picker-select clickable-icon",
			attr: { "aria-label": `Select ${font.label}`, type: "button" },
		});
		setIcon(selectBtn, font.id === this.selectedId ? "check" : "circle");
		selectBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			void this.choose(font.id);
		});

		row.addEventListener("click", () => {
			void this.choose(font.id);
		});
	}

	private async choose(fontId: string): Promise<void> {
		await this.onSelect(fontId);
		this.close();
	}
}

export { previewWeightsFor } from "./fontPickerUtils";
