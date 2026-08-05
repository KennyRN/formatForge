import { App, DropdownComponent, Setting, SettingGroup, ToggleComponent } from "obsidian";
import { CUSTOM_FONTS } from "../fonts";
import type { SfPaletteColor } from "../storyforgeBridge";

/** Shared building blocks for TextStyleModal, UiFormattingModal — free functions
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

export function applyColorPick(hex: string, paint: (hex: string) => void, onPick: (hex: string) => void): void {
	paint(hex);
	onPick(hex);
}

export function openColorSwatchPicker(
	app: App,
	getPalette: () => { name: string; variant: string; customColors: SfPaletteColor[] },
	paint: (hex: string) => void,
	onPick: (hex: string) => void,
): void {
	const p = getPalette();
	void import("./PalettePickerModal").then(({ PalettePickerModal }) => {
		new PalettePickerModal(app, p.name, p.variant, p.customColors, (hex) =>
			applyColorPick(hex, paint, onPick),
		).open();
	});
}

export function bindColorSwatchButton(
	app: App,
	getPalette: () => { name: string; variant: string; customColors: SfPaletteColor[] },
	buttonEl: HTMLElement,
	initialHex: string,
	onPick: (hex: string) => void,
): void {
	buttonEl.addClass("sf-color-swatch-btn");
	buttonEl.setAttr("aria-label", "Choose colour");
	const paint = (hex: string) => {
		buttonEl.style.backgroundColor = hex;
	};
	paint(initialHex);
	buttonEl.addEventListener("click", () => openColorSwatchPicker(app, getPalette, paint, onPick));
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
		opt.style.fontWeight = val;
	}
	dropdown.setValue(value);
	dropdown.selectEl.style.fontWeight = value;
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
		dropdown.selectEl.style.fontWeight = v;
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
	/** Append into this group; otherwise a new SettingGroup is created on `body`. */
	group?: SettingGroup;
	body?: HTMLElement;
}

function resolvePreviewFontSizeEm(value: number | (() => number) | undefined): number {
	const raw = typeof value === "function" ? value() : value;
	return Number.isFinite(raw) && (raw as number) > 0 ? (raw as number) : 1;
}

/** Override + Pick font + Font weight (+ optional Small caps), shared by Text Style and UI Formatting. */
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
	} = opts;
	const card = opts.group ?? new SettingGroup(opts.body!);

	let overrideToggle!: ToggleComponent;
	card.addSetting((setting) => {
		setting.setName("Override theme's default font").addToggle((toggle) => {
			overrideToggle = toggle;
			toggle.setValue(settings[overrideFontKey] as boolean);
		});
	});

	let selectedFontFamily: string = settings[fontFamilyKey] as string;

	let pickFontSetting!: Setting;
	let pickFontButtonEl: HTMLElement | null = null;
	const syncPickFontButtonLabel = () => {
		const font = CUSTOM_FONTS.find((f) => f.id === selectedFontFamily);
		if (pickFontButtonEl) pickFontButtonEl.setText(font?.label ?? "Pick font");
	};
	const applySelectedFont = async (value: string) => {
		await host.updateSetting(fontFamilyKey, value);
		selectedFontFamily = value;
		syncPickFontButtonLabel();
		const clampedWeight = syncWeightDropdown();
		const currentWeight = host.getSettings()[fontWeightKey] as string;
		if (clampedWeight !== currentWeight) {
			await host.updateSetting(fontWeightKey, clampedWeight);
		}
		applyVisibility(!overrideToggle.getValue());
		restyle();
	};
	card.addSetting((setting) => {
		pickFontSetting = setting;
		setting.setName("Pick font");
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
					).open();
				});
			});
		});
	});

	let fontWeightSetting!: Setting;
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
	card.addSetting((setting) => {
		fontWeightSetting = setting;
		setting.setName("Font weight");
		setting.addDropdown((dropdown) => {
			weightDropdown = dropdown;
			const options = weightOptionsForSelected();
			const initial = clampFontWeightToOptions(settings[fontWeightKey] as string, options);
			populateFontWeightDropdown(dropdown, initial, onWeightChange, options);
		});
	});

	let smallCapsSetting: Setting | undefined;
	if (smallCapsKey) {
		card.addSetting((setting) => {
			smallCapsSetting = setting;
			setting.setName("Small caps").addToggle((toggle) =>
				toggle.setValue(settings[smallCapsKey] as boolean).onChange((value) => {
					void host.updateSetting(smallCapsKey, value).then(() => restyle());
				}),
			);
			setting.nameEl.addClass("sf-small-caps-label");
		});
	}

	const isSelectedFontVariable = (): boolean => {
		const font = CUSTOM_FONTS.find((f) => f.id === selectedFontFamily);
		return font ? font.weightMin !== font.weightMax : true;
	};
	const applyVisibility = (overrideOff: boolean) => {
		pickFontSetting.settingEl.toggleClass("sf-settings-hidden", overrideOff);
		smallCapsSetting?.settingEl.toggleClass("sf-settings-hidden", overrideOff);
		fontWeightSetting.settingEl.toggleClass("sf-settings-hidden", overrideOff || !isSelectedFontVariable());
		if (!overrideOff && isSelectedFontVariable()) syncWeightDropdown();
	};
	overrideToggle.onChange((value) => {
		void host.updateSetting(overrideFontKey, value).then(() => {
			applyVisibility(!value);
			restyle();
		});
	});
	applyVisibility(!(settings[overrideFontKey] as boolean));
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
): { toggle: ToggleComponent; card: SettingGroup } {
	const card = new SettingGroup(body);
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

/** Builds the tab bar + body-visibility wiring shared by TextStyleModal and UiFormattingModal. */
export function renderTabbedBody(
	contentEl: HTMLElement,
	tabs: StyleModalTab[],
	options?: { onActivate?: (id: string) => void },
): void {
	const tabBar = contentEl.createDiv({ cls: "sf-text-style-tab-bar" });
	const tabBodyWrapper = contentEl.createDiv({ cls: "sf-text-style-tab-body-wrapper" });

	const tabBodies: HTMLElement[] = [];
	let activeTabId = tabs[0].id;

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
