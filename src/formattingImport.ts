import {
	PALETTE_KEYS,
	SF_TEXT_STYLING_KEYS,
	type FormattingExportDocument,
	type FormattingExportSelection,
} from "./formattingExport";
import {
	hostSupportsBatchUpdates,
	type SfFormattingApi,
	type SfLinkedFormattingKey,
} from "./storyforgeBridge";

export interface FormattingImportHost {
	/** Returns keys that were rejected during local coerce, if any. */
	importTextStylingSettings(data: unknown): Promise<string[]>;
	getStoryForgeApi(): SfFormattingApi | null;
}

function withoutKeys(
	source: Record<string, unknown>,
	excluded: ReadonlySet<string>,
): Record<string, unknown> {
	return Object.fromEntries(Object.entries(source).filter(([key]) => !excluded.has(key)));
}

function pickKeys(
	source: Record<string, unknown>,
	keys: readonly string[],
): Record<string, unknown> {
	return Object.fromEntries(
		keys
			.filter((key) => Object.prototype.hasOwnProperty.call(source, key))
			.map((key) => [key, source[key]]),
	);
}

/**
 * Applies only the selected sections. Known storyForge keys are intersected with
 * the live API snapshot so documents cannot inject unknown host settings.
 *
 * Host-validated storyForge updates run before formatForge persistence so an
 * invalid linked value fails before local text styling is rewritten.
 */
export async function applyFormattingDocument(
	host: FormattingImportHost,
	document: FormattingExportDocument,
	selected: FormattingExportSelection,
): Promise<string[]> {
	const paletteExcluded = new Set<string>(PALETTE_KEYS);
	const local: Record<string, unknown> = {};
	if (selected.textStyling && document.textStyling) {
		Object.assign(local, withoutKeys(document.textStyling, paletteExcluded));
	}
	if (selected.palette && document.palette) {
		Object.assign(local, document.palette);
	}

	const sfApi = host.getStoryForgeApi();
	const linked: Record<string, unknown> = {};
	if (selected.textStyling && document.textStyling) {
		Object.assign(linked, pickKeys(document.textStyling, SF_TEXT_STYLING_KEYS));
	}
	if (selected.storyForgeInterface && document.storyForgeInterface) {
		Object.assign(linked, withoutKeys(document.storyForgeInterface, paletteExcluded));
	}

	const willTouchHost =
		sfApi !== null &&
		(Object.keys(linked).length > 0 || (selected.palette && document.palette !== null));
	const willTouchLocal = Object.keys(local).length > 0;
	if (!willTouchHost && !willTouchLocal) {
		throw new Error("Nothing selected to apply");
	}

	if (sfApi) {
		const current = sfApi.getLinkedSettings();
		const hostPatch: Partial<Record<SfLinkedFormattingKey, unknown>> = {};
		for (const key of Object.keys(current) as SfLinkedFormattingKey[]) {
			if (Object.prototype.hasOwnProperty.call(linked, key)) {
				hostPatch[key] = linked[key];
			}
		}
		if (selected.palette && document.palette) {
			hostPatch.colorPaletteName = document.palette.colorPaletteName;
			hostPatch.colorPaletteVariant = document.palette.colorPaletteVariant;
			hostPatch.customPaletteColors = document.palette.customPaletteColors;
		}

		if (hostSupportsBatchUpdates(sfApi) && Object.keys(hostPatch).length > 0) {
			await sfApi.updateLinkedSettings!(hostPatch);
		} else {
			let hostChanged = false;
			for (const key of Object.keys(hostPatch) as SfLinkedFormattingKey[]) {
				if (
					key === "colorPaletteName" ||
					key === "colorPaletteVariant" ||
					key === "customPaletteColors"
				) {
					continue;
				}
				await sfApi.updateLinkedSetting(key, hostPatch[key]);
				hostChanged = true;
			}
			if (selected.palette && document.palette) {
				await sfApi.updatePalette({
					name: document.palette.colorPaletteName as Parameters<
						SfFormattingApi["updatePalette"]
					>[0]["name"],
					variant: document.palette.colorPaletteVariant as string,
					customColors: document.palette.customPaletteColors as Parameters<
						SfFormattingApi["updatePalette"]
					>[0]["customColors"],
				});
				hostChanged = true;
			}
			if (hostChanged) sfApi.applyLinkedStyles();
		}
	}

	if (willTouchLocal) {
		try {
			return await host.importTextStylingSettings(local);
		} catch (error) {
			// The host write above already landed (and, for `hostSupportsBatchUpdates`,
			// already saved and restyled). There is no distributed transaction across
			// the two plugins, so surface that the two are now out of step rather than
			// reporting a plain "apply failed" that implies nothing happened.
			if (willTouchHost) {
				const reason = error instanceof Error ? error.message : String(error);
				throw new Error(
					`storyForge settings were applied, but formatForge's local settings failed to save (${reason}). The two may now differ until you re-apply.`,
				);
			}
			throw error;
		}
	}
	return [];
}
