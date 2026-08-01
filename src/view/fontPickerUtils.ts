import type { CustomFontEntry } from "../fonts";

/** Conventional CSS / OpenType weight names for picker labels. */
const WEIGHT_NAMES: Record<number, string> = {
	100: "Thin",
	200: "Extra Light",
	300: "Light",
	400: "Normal",
	500: "Medium",
	600: "Semi Bold",
	700: "Bold",
	800: "Extra Bold",
	900: "Black",
};

/** Nearest named weight label for a numeric axis value. */
export function weightNameFor(weight: number): string {
	const named = WEIGHT_NAMES[weight];
	if (named) return named;
	const steps = Object.keys(WEIGHT_NAMES).map(Number).sort((a, b) => a - b);
	let best = steps[0];
	let bestDist = Math.abs(weight - best);
	for (const step of steps) {
		const dist = Math.abs(weight - step);
		if (dist < bestDist) {
			best = step;
			bestDist = dist;
		}
	}
	return WEIGHT_NAMES[best] ?? `Weight ${weight}`;
}

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
	if (font.weightMin === font.weightMax) return weightNameFor(weight);
	if (weight === font.weightMin) return `${weightNameFor(weight)} (${weight})`;
	if (weight === font.weightMax) return `${weightNameFor(weight)} (${weight})`;
	if (weight === 400) return `${weightNameFor(weight)} (${weight})`;
	return `${weightNameFor(weight)} (${weight})`;
}
