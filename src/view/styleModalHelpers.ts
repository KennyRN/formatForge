import { App, DropdownComponent, Setting, SettingGroup, ToggleComponent } from "obsidian";
import { CUSTOM_FONTS } from "../fonts";
import type { PaletteName } from "../colorPalettes";
import type { SfPaletteColor } from "../storyforgeBridge";

/** Shared building blocks for TextStyleModal — free functions
 * rather than a base class, matching the codebase's existing preference,
 * that accept minimal host interfaces rather than the full plugin class. */

export const FONT_WEIGHT_OPTIONS: [string, string][] = [
	["300", "Light"],
	["400", "Normal"],
	["500", "Medium"],
	["600", "Semi Bold"],
	["700", "Bold"],
	["800", "Extra Bold"],
	["900", "Black"],
];

/** Weight dropdown choices that fall within a custom font's native weightMin–weightMax range. */
export function fontWeightOptionsFor(weightMin: number, weightMax: number): [string, string][] {
	return FONT_WEIGHT_OPTIONS.filter(([val]) => {
		const n = Number(val);
		return n >= weightMin && n <= weightMax;
	});
}

/** Nearest allowed weight option for `weight`, or `weight` unchanged when already allowed / options empty. */
export function clampFontWeightToOptions(weight: string, options: [string, string][]): string {
	if (options.length === 0 || options.some(([val]) => val === weight)) return weight;
	const n = Number(weight);
	let best = options[0][0];
	let bestDist = Infinity;
	for (const [val] of options) {
		const d = Math.abs(Number(val) - n);
		if (d < bestDist) {
			bestDist = d;
			best = val;
		}
	}
	return best;
}

/** A swatch button/picker with this wired in gets a "Theme default" choice alongside its real colours. */
export interface ColorSwatchThemeDefaultOption {
	isActive: boolean;
	onSelect: () => void | Promise<void>;
}

/** A swatch button/picker with this wired in gets a "Muted" choice above the palette colours. */
export interface ColorSwatchMutedOption {
	isActive: boolean;
	onSelect: () => void | Promise<void>;
	onClear: () => void | Promise<void>;
}

export function applyColorPick(hex: string, paint: (hex: string | null) => void, onPick: (hex: string) => void): void {
	paint(hex);
	onPick(hex);
}

export function openColorSwatchPicker(
	app: App,
	getPalette: () => { name: string; variant: string; customColors: SfPaletteColor[] },
	paint: (hex: string | null) => void,
	onPick: (hex: string) => void,
	themeDefault?: ColorSwatchThemeDefaultOption,
	muted?: ColorSwatchMutedOption,
): void {
	const p = getPalette();
	void import("./PalettePickerModal").then(({ PalettePickerModal, resolveThemeMutedColor }) => {
		new PalettePickerModal(
			app,
			p.name as PaletteName,
			p.variant,
			p.customColors,
			(hex) => {
				void Promise.resolve(muted?.isActive ? muted.onClear() : undefined).then(() => {
					applyColorPick(hex, paint, onPick);
				});
			},
			themeDefault && {
				isActive: themeDefault.isActive,
				onSelect: () => {
					paint(null);
					return themeDefault.onSelect();
				},
			},
			muted && {
				isActive: muted.isActive,
				onSelect: () => {
					paint(resolveThemeMutedColor());
					return muted.onSelect();
				},
			},
		).open();
	});
}

/**
 * Binds a colour swatch button to open the palette picker on click. When `themeDefault` is
 * passed, the picker's list gets a "Theme default" entry after every real colour. When `muted`
 * is passed, the picker's list gets a "Muted" entry above the palette colours (replacing a
 * separate muted toggle), and the button paints the live muted colour while that option is active.
 */
export function bindColorSwatchButton(
	app: App,
	getPalette: () => { name: string; variant: string; customColors: SfPaletteColor[] },
	buttonEl: HTMLElement,
	initialHex: string,
	onPick: (hex: string) => void,
	themeDefault?: ColorSwatchThemeDefaultOption,
	muted?: ColorSwatchMutedOption,
): void {
	buttonEl.addClass("sf-color-swatch-btn");
	buttonEl.setAttr("aria-label", "Choose colour");
	const paint = (hex: string | null) => {
		buttonEl.toggleClass("sf-color-swatch-btn--theme-default", hex === null);
		buttonEl.setCssStyles({ backgroundColor: hex ?? "" });
	};
	if (muted?.isActive) {
		void import("./PalettePickerModal").then(({ resolveThemeMutedColor }) => {
			paint(resolveThemeMutedColor());
		});
	} else {
		paint(themeDefault?.isActive ? null : initialHex);
	}
	buttonEl.addEventListener("click", () => openColorSwatchPicker(app, getPalette, paint, onPick, themeDefault, muted));
}

export function applyFontWeightChange<W extends string>(
	v: W,
	applySelectedWeight: (v: W) => void,
	onChange: (value: W) => void,
): void {
	onChange(v);
	applySelectedWeight(v);
}

/** Clears and repopulates weight `<option>`s; does not (re)bind onChange. */
export function fillFontWeightOptions(
	dropdown: { selectEl: HTMLSelectElement; addOption: (value: string, display: string) => unknown; setValue: (value: string) => unknown },
	value: string,
	options: [string, string][] = FONT_WEIGHT_OPTIONS,
): void {
	dropdown.selectEl.replaceChildren();
	for (const [val, label] of options) {
		dropdown.addOption(val, label);
		const opt = dropdown.selectEl.options[dropdown.selectEl.options.length - 1];
		opt.setCssStyles({ fontWeight: val });
	}
	dropdown.setValue(value);
	dropdown.selectEl.setCssStyles({ fontWeight: value });
}

export function populateFontWeightDropdown<W extends string>(
	dropdown: {
		selectEl: HTMLSelectElement;
		addOption: (value: string, display: string) => unknown;
		setValue: (value: string) => unknown;
		onChange: (cb: (value: string) => void) => unknown;
	},
	value: W,
	onChange: (value: W) => void,
	options: [string, string][] = FONT_WEIGHT_OPTIONS,
): void {
	fillFontWeightOptions(dropdown, value, options);
	const applySelectedWeight = (v: W) => {
		dropdown.selectEl.setCssStyles({ fontWeight: v });
	};
	dropdown.onChange((v) => applyFontWeightChange(v as W, applySelectedWeight, onChange));
}

export function bindFontWeightDropdown<W extends string>(
	setting: Setting,
	value: W,
	onChange: (value: W) => void,
	options: [string, string][] = FONT_WEIGHT_OPTIONS,
): void {
	setting.addDropdown((dropdown) => {
		populateFontWeightDropdown(dropdown, value, onChange, options);
	});
}

/**
 * Minimal interface accepted by `renderCustomFontCard`.
 * FormatForgePlugin and SfLinkedSettingsAdapter both satisfy this.
 */
export interface FontCardHost {
	getSettings(): Record<string, unknown>;
	updateSetting(key: string, value: unknown): Promise<void>;
}

export interface RenderCustomFontCardOptions {
	app: App;
	host: FontCardHost;
	settings: Record<string, unknown>;
	overrideFontKey: string;
	fontWeightKey: string;
	fontFamilyKey: string;
	smallCapsKey?: string;
	restyle: () => void;
	/**
	 * Preview size for the font-picker modal (em). Defaults to 1.
	 * Pass the region's current size when the user has overridden it there.
	 * May be a getter so the modal reads the latest slider value on open.
	 */
	previewFontSizeEm?: number | (() => number);
	/** Label for the pick-font row. Defaults to "Pick font". */
	pickFontName?: string;
	/** CSS font-family used to preview the Theme default row. */
	themeDefaultPreviewFamily?: string;
	/** Append into this group; otherwise a new SettingGroup is created on `body`. */
	group?: SettingGroup;
	body?: HTMLElement;
}

function resolvePreviewFontSizeEm(value: number | (() => number) | undefined): number {
	const raw = typeof value === "function" ? value() : value;
	return Number.isFinite(raw) && (raw as number) > 0 ? (raw as number) : 1;
}

/**
 * Pick font (with a "Theme default" entry at the bottom of its own list, replacing the old
 * separate "Override theme's default font" toggle) and Font weight on the same row. When
 * `smallCapsKey` is set, Small caps lives inside the font picker and the catalogue samples
 * follow the toggle. Weight stays hidden while at theme default.
 */
export function renderCustomFontCard(opts: RenderCustomFontCardOptions): SettingGroup {
	const {
		app,
		host,
		settings,
		overrideFontKey,
		fontWeightKey,
		fontFamilyKey,
		smallCapsKey,
		restyle,
		previewFontSizeEm,
		pickFontName,
		themeDefaultPreviewFamily,
	} = opts;
	const card = opts.group ?? new SettingGroup(opts.body!);

	let isOverriding = settings[overrideFontKey] as boolean;
	let selectedFontFamily: string = settings[fontFamilyKey] as string;

	let pickFontButtonEl: HTMLElement | null = null;
	const smallCapsOn = (): boolean => !!(smallCapsKey && host.getSettings()[smallCapsKey]);
	const syncPickFontButtonLabel = () => {
		if (!pickFontButtonEl) return;
		if (!isOverriding) {
			pickFontButtonEl.setText("Theme default");
		} else {
			const font = CUSTOM_FONTS.find((f) => f.id === selectedFontFamily);
			pickFontButtonEl.setText(font?.label ?? "Pick font");
		}
		pickFontButtonEl.toggleClass("sf-small-caps-label", smallCapsOn());
	};
	const applySelectedFont = async (value: string) => {
		isOverriding = true;
		await host.updateSetting(overrideFontKey, true);
		await host.updateSetting(fontFamilyKey, value);
		selectedFontFamily = value;
		syncPickFontButtonLabel();
		const clampedWeight = syncWeightDropdown();
		const currentWeight = host.getSettings()[fontWeightKey] as string;
		if (clampedWeight !== currentWeight) {
			await host.updateSetting(fontWeightKey, clampedWeight);
		}
		applyVisibility();
		restyle();
	};
	const applyThemeDefault = async () => {
		isOverriding = false;
		await host.updateSetting(overrideFontKey, false);
		syncPickFontButtonLabel();
		applyVisibility();
		restyle();
	};
	let weightDropdown!: DropdownComponent;
	const weightOptionsForSelected = (): [string, string][] => {
		const font = CUSTOM_FONTS.find((f) => f.id === selectedFontFamily);
		return font ? fontWeightOptionsFor(font.weightMin, font.weightMax) : FONT_WEIGHT_OPTIONS;
	};
	const onWeightChange = (value: string) => {
		void host.updateSetting(fontWeightKey, value).then(() => restyle());
	};
	const syncWeightDropdown = (): string => {
		const options = weightOptionsForSelected();
		const current = host.getSettings()[fontWeightKey] as string;
		const clamped = clampFontWeightToOptions(current, options);
		fillFontWeightOptions(weightDropdown, clamped, options);
		return clamped;
	};
	const isSelectedFontVariable = (): boolean => {
		const font = CUSTOM_FONTS.find((f) => f.id === selectedFontFamily);
		return font ? font.weightMin !== font.weightMax : true;
	};
	const applyVisibility = () => {
		const overrideOff = !isOverriding;
		weightDropdown.selectEl.toggleClass("sf-settings-hidden", overrideOff || !isSelectedFontVariable());
		if (!overrideOff && isSelectedFontVariable()) syncWeightDropdown();
	};
	card.addSetting((setting) => {
		setting.settingEl.addClass("sf-font-row");
		setting.setName(pickFontName ?? "Pick font");
		setting.addButton((button) => {
			pickFontButtonEl = button.buttonEl;
			button.setCta();
			syncPickFontButtonLabel();
			button.onClick(() => {
				void import("./FontPickerModal").then(({ FontPickerModal }) => {
					new FontPickerModal(
						app,
						selectedFontFamily,
						resolvePreviewFontSizeEm(previewFontSizeEm),
						(id) => applySelectedFont(id),
						{
							isActive: !isOverriding,
							onSelect: () => applyThemeDefault(),
							previewFamily: themeDefaultPreviewFamily ?? "var(--font-interface)",
						},
						smallCapsKey
							? {
									enabled: smallCapsOn(),
									onChange: async (enabled) => {
										await host.updateSetting(smallCapsKey, enabled);
										syncPickFontButtonLabel();
										restyle();
									},
								}
							: undefined,
					).open();
				});
			});
		});
		setting.addDropdown((dropdown) => {
			weightDropdown = dropdown;
			dropdown.selectEl.addClass("sf-font-weight-dropdown");
			dropdown.selectEl.setAttr("aria-label", "Font weight");
			const options = weightOptionsForSelected();
			const initial = clampFontWeightToOptions(settings[fontWeightKey] as string, options);
			populateFontWeightDropdown(dropdown, initial, onWeightChange, options);
		});
	});
	applyVisibility();
	return card;
}

export function applyExclusiveToggle(
	value: boolean,
	other: ToggleComponent,
	persistSelf: (value: boolean) => void,
	persistOther: (value: boolean) => void,
): void {
	if (value && other.getValue()) {
		other.setValue(false);
		persistOther(false);
	}
	persistSelf(value);
}

export function bindExclusivePair(
	toggleA: ToggleComponent,
	toggleB: ToggleComponent,
	persistA: (value: boolean) => void,
	persistB: (value: boolean) => void,
): void {
	toggleA.onChange((value) => applyExclusiveToggle(value, toggleB, persistA, persistB));
	toggleB.onChange((value) => applyExclusiveToggle(value, toggleA, persistB, persistA));
}

export function applyCardToggle(
	value: boolean,
	persist: (value: boolean) => void,
	applyVisibility: (hidden: boolean) => void,
	restyle: () => void,
): void {
	persist(value);
	applyVisibility(!value);
	restyle();
}

export function wireCardToggle(toggle: ToggleComponent, card: Setting, persist: (value: boolean) => void, restyle: () => void): void {
	const applyVisibility = (hidden: boolean) => card.settingEl.toggleClass("sf-settings-hidden", hidden);
	toggle.onChange((value) => applyCardToggle(value, persist, applyVisibility, restyle));
	applyVisibility(!toggle.getValue());
}

export function renderToggleWithRevealCard(
	body: HTMLElement,
	toggleLabel: string,
	initialValue: boolean,
	persist: (value: boolean) => void,
	buildRevealRow: (card: SettingGroup) => Setting,
	restyle: () => void,
	extraRowBefore?: (card: SettingGroup) => void,
	group?: SettingGroup,
): { toggle: ToggleComponent; card: SettingGroup } {
	const card = group ?? new SettingGroup(body);
	if (extraRowBefore) extraRowBefore(card);
	let toggle!: ToggleComponent;
	card.addSetting((setting) => {
		setting.setName(toggleLabel).addToggle((t) => {
			toggle = t;
			t.setValue(initialValue);
		});
	});
	const revealRow = buildRevealRow(card);
	wireCardToggle(toggle, revealRow, persist, restyle);
	return { toggle, card };
}

export interface StyleModalTab {
	id: string;
	label: string;
	render: (body: HTMLElement) => void;
}

/** Builds the tab bar + body-visibility wiring used by TextStyleModal. */
export function renderTabbedBody(
	contentEl: HTMLElement,
	tabs: StyleModalTab[],
	options?: { onActivate?: (id: string) => void; initialId?: string },
): void {
	const tabBar = contentEl.createDiv({ cls: "sf-text-style-tab-bar" });
	const tabBodyWrapper = contentEl.createDiv({ cls: "sf-text-style-tab-body-wrapper" });

	const tabBodies: HTMLElement[] = [];
	const initialId = options?.initialId;
	let activeTabId = initialId && tabs.some((tab) => tab.id === initialId) ? initialId : tabs[0].id;

	const activate = (id: string) => {
		activeTabId = id;
		tabBar.querySelectorAll(".sf-text-style-tab-btn").forEach((btn) => btn.removeClass("is-active"));
		let activeHostsTabs = false;
		tabBodies.forEach((body, i) => {
			const isActive = tabs[i].id === activeTabId;
			body.toggleClass("sf-settings-hidden", !isActive);
			if (isActive) {
				const btn = tabBar.children[i] as HTMLElement | undefined;
				btn?.addClass("is-active");
				activeHostsTabs = body.hasClass("is-tab-host");
			}
		});
		// Nested tab bars must not scroll away: when the visible body carries its own
		// tab bar, this wrapper hands height down to the deeper wrapper (which scrolls);
		// otherwise this wrapper is the leaf scroller. Overflow is set inline rather than
		// via the stylesheet because the cascade for these deeply-nested wrappers proved
		// unreliable at runtime (the leaf resolved to overflow-y:visible), and inline wins.
		tabBodyWrapper.toggleClass("is-tab-host", activeHostsTabs);
		tabBodyWrapper.setCssStyles({
			overflowX: "hidden",
			overflowY: activeHostsTabs ? "hidden" : "auto",
		});
		options?.onActivate?.(id);
	};

	tabs.forEach((tab) => {
		const tabBtn = tabBar.createEl("button", { cls: "sf-text-style-tab-btn", text: tab.label });
		if (tab.id === activeTabId) {
			tabBtn.addClass("is-active");
		}
		tabBtn.addEventListener("click", () => activate(tab.id));

		const bodyEl = tabBodyWrapper.createDiv({ cls: "sf-text-style-tab-body" });
		if (tab.id !== activeTabId) {
			bodyEl.addClass("sf-settings-hidden");
		}
		tab.render(bodyEl);
		if (bodyEl.firstElementChild?.hasClass("sf-text-style-tab-bar")) {
			bodyEl.addClass("is-tab-host");
		}
		tabBodies.push(bodyEl);
	});

	activate(activeTabId);
}
