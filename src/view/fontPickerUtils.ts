import type { CustomFontEntry } from "../fonts";

/** Variable faces: min, normal (400 clamped into range), max. Fixed faces: normal only. */
export function previewWeightsFor(font: CustomFontEntry): number[] {
	if (font.weightMin === font.weightMax) {
		return [font.weightMin];
	}
	const normal = Math.max(font.weightMin, Math.min(400, font.weightMax));
	const weights = [font.weightMin, normal, font.weightMax];
	// Deduplicate when normal coincides with an endpoint (e.g. min=400).
	return [...new Set(weights)];
}

export function weightPreviewLabel(weight: number, font: CustomFontEntry): string {
	if (font.weightMin === font.weightMax) return "Normal";
	if (weight === font.weightMin) return `Minimum (${weight})`;
	if (weight === font.weightMax) return `Maximum (${weight})`;
	if (weight === 400) return `Normal (${weight})`;
	return `Weight ${weight}`;
}
