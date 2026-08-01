import { describe, expect, it } from "vitest";
import { CUSTOM_FONTS } from "../fonts";
import { previewWeightsFor } from "../view/fontPickerUtils";

describe("FontPickerModal preview weights", () => {
	it("lists every catalog font alphabetically with expected samples", () => {
		const labels = [...CUSTOM_FONTS].sort((a, b) => a.label.localeCompare(b.label)).map((f) => f.label);
		expect(labels[0].localeCompare(labels[1])).toBeLessThanOrEqual(0);
		expect(labels).toContain("Courier Prime");
		expect(labels).not.toContain("Roboto Flex");
	});

	it("uses a single normal sample for fixed-weight fonts", () => {
		const courier = CUSTOM_FONTS.find((f) => f.id === "courier-prime");
		expect(courier).toBeTruthy();
		expect(previewWeightsFor(courier!)).toEqual([400]);
	});

	it("uses min / normal / max for variable fonts, deduping endpoints", () => {
		const ibm = CUSTOM_FONTS.find((f) => f.id === "ibm-plex-sans-var");
		expect(ibm).toBeTruthy();
		expect(previewWeightsFor(ibm!)).toEqual([ibm!.weightMin, 400, ibm!.weightMax]);

		const fake = { ...ibm!, weightMin: 400, weightMax: 900 };
		expect(previewWeightsFor(fake)).toEqual([400, 900]);
	});
});
