import { addIcon, App, DropdownComponent, Modal, Notice, setIcon, Setting } from "obsidian";
import {
	buildFormattingExport,
	parseFormattingExport,
	stringifyFormattingExport,
	type FormattingExportDocument,
	type FormattingExportSelection,
} from "../formattingExport";
import { applyFormattingDocument } from "../formattingImport";
import type FormatForgePlugin from "../main";
import {
	hostSupportsBackupExports,
	hostSupportsPresetManagement,
	hostSupportsThemeLibrary,
	type SfFormattingApi,
} from "../storyforgeBridge";
import { renderTabbedBody, type StyleModalTab } from "./styleModalHelpers";

/** Same floppy glyph storyForge registers as `sf-floppy-duotone` (formatting themes). */
const ICON_FLOPPY_DUOTONE = "sf-floppy-duotone";
const FLOPPY_DUOTONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="currentColor"><path d="M20.536 20.536C22 19.07 22 16.714 22 12c0-.341 0-.512-.015-.686a4.04 4.04 0 0 0-.921-2.224a8 8 0 0 0-.483-.504l-5.167-5.167a9 9 0 0 0-.504-.483a4.04 4.04 0 0 0-2.224-.92C12.512 2 12.342 2 12 2C7.286 2 4.929 2 3.464 3.464C2 4.93 2 7.286 2 12s0 7.071 1.464 8.535c.685.685 1.563 1.05 2.786 1.243l1.5.153C8.906 22 10.3 22 12 22s3.094 0 4.25-.069l1.5-.153c1.223-.194 2.102-.558 2.785-1.242" opacity=".5" /><path d="M7 7.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5zm6.052 9c.899 0 1.648 0 2.242.08c.628.084 1.195.27 1.65.726c.456.455.642 1.022.726 1.65c.08.594.08 1.343.08 2.242v.833l-1.5.14V21c0-.964-.002-1.612-.067-2.095c-.062-.461-.169-.659-.3-.789s-.327-.237-.788-.3c-.483-.064-1.131-.066-2.095-.066h-2c-.964 0-1.612.002-2.095.067c-.461.062-.659.169-.789.3s-.237.327-.3.788c-.064.483-.066 1.131-.066 2.095v.926l-1.5-.149v-.829c0-.899 0-1.648.08-2.242c.084-.628.27-1.195.725-1.65c.456-.456 1.023-.642 1.65-.726c.595-.08 1.345-.08 2.243-.08z" /></g></svg>`;

/** Dual-tone eye used on SeriesModal's "hide, or show, obsidian's interface elements" row. */
const ICON_EYE_DUOTONE = "sf-eye-duotone";
const EYE_DUOTONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="currentColor"><path d="M2 12c0 1.64.425 2.191 1.275 3.296C4.972 17.5 7.818 20 12 20s7.028-2.5 8.725-4.704C21.575 14.192 22 13.639 22 12c0-1.64-.425-2.191-1.275-3.296C19.028 6.5 16.182 4 12 4S4.972 6.5 3.275 8.704C2.425 9.81 2 10.361 2 12" opacity=".5" /><path fill-rule="evenodd" d="M8.25 12a3.75 3.75 0 1 1 7.5 0a3.75 3.75 0 0 1-7.5 0m1.5 0a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0" clip-rule="evenodd" /></g></svg>`;

/** User-provided reicon download-duotone. */
const ICON_DOWNLOAD_DUOTONE = "ff-download-duotone";
const DOWNLOAD_DUOTONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z" /><g fill="currentColor"><path d="M22 16v-1c0-2.828 0-4.242-.879-5.12C20.242 9 18.828 9 16 9H8c-2.829 0-4.243 0-5.122.88C2 10.757 2 12.17 2 14.997V16c0 2.829 0 4.243.879 5.122C3.757 22 5.172 22 8 22h8c2.828 0 4.243 0 5.121-.878C22 20.242 22 18.829 22 16" opacity=".5"/><path fill-rule="evenodd" d="M12 1.25a.75.75 0 0 0-.75.75v10.973l-1.68-1.961a.75.75 0 1 0-1.14.976l3 3.5a.75.75 0 0 0 1.14 0l3-3.5a.75.75 0 1 0-1.14-.976l-1.68 1.96V2a.75.75 0 0 0-.75-.75" clip-rule="evenodd"/></g></svg>`;

const ICON_COPY_FILLED = "ff-copy-filled";
const COPY_FILLED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="currentColor"><path d="M15.24 2H11.3458C9.58159 1.99999 8.18418 1.99997 7.09054 2.1476C5.96501 2.29953 5.05402 2.61964 4.33559 3.34096C3.61717 4.06227 3.29833 4.97692 3.14701 6.10697C2.99997 7.205 2.99999 8.60802 3 10.3793V16.2169C3 17.725 3.91995 19.0174 5.22717 19.5592C5.15989 18.6498 5.15994 17.3737 5.16 16.312L5.16 11.3976L5.16 11.3024C5.15993 10.0207 5.15986 8.91644 5.27828 8.03211C5.40519 7.08438 5.69139 6.17592 6.4253 5.43906C7.15921 4.70219 8.06404 4.41485 9.00798 4.28743C9.88877 4.16854 10.9887 4.1686 12.2652 4.16867L12.36 4.16868H15.24L15.3348 4.16867C16.6113 4.1686 17.7088 4.16854 18.5896 4.28743C18.0627 2.94779 16.7616 2 15.24 2Z" opacity=".5" /><path d="M6.6001 11.3974C6.6001 8.67119 6.6001 7.3081 7.44363 6.46118C8.28716 5.61426 9.64481 5.61426 12.3601 5.61426H15.2401C17.9554 5.61426 19.313 5.61426 20.1566 6.46118C21.0001 7.3081 21.0001 8.6712 21.0001 11.3974V16.2167C21.0001 18.9429 21.0001 20.306 20.1566 21.1529C19.313 21.9998 17.9554 21.9998 15.2401 21.9998H12.3601C9.64481 21.9998 8.28716 21.9998 7.44363 21.1529C6.6001 20.306 6.6001 18.9429 6.6001 16.2167V11.3974Z" /></g></svg>`;

/** User-provided reicon edit (outline). Stroke-based so it matches the given glyph. */
const ICON_EDIT = "ff-edit";
const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z" /><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M11 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7v-2"/><path stroke-miterlimit="10" d="M16.04 3.02L8.16 10.9c-.3.3-.6.89-.66 1.32l-.43 3.01c-.16 1.09.61 1.85 1.7 1.7l3.01-.43c.42-.06 1.01-.36 1.32-.66l7.88-7.88c1.36-1.36 2-2.94 0-4.94s-3.58-1.36-4.94 0"/><path stroke-miterlimit="10" d="M14.91 4.15a7.14 7.14 0 0 0 4.94 4.94"/></g></svg>`;

/** reicon close-square-duotone — square at half opacity, X at full. */
const ICON_CLOSE_SQUARE_DUOTONE = "ff-close-square-duotone";
const CLOSE_SQUARE_DUOTONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="currentColor"><path d="M12 22c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22" opacity=".5"/><path d="M8.97 8.97a.75.75 0 0 1 1.06 0L12 10.94l1.97-1.97a.75.75 0 1 1 1.06 1.06L13.06 12l1.97 1.97a.75.75 0 1 1-1.06 1.06L12 13.06l-1.97 1.97a.75.75 0 0 1-1.06-1.06L10.94 12l-1.97-1.97a.75.75 0 0 1 0-1.06"/></g></svg>`;

/** User-provided reicon check-square-duotone — square at half opacity, check at full. */
const ICON_CHECK_SQUARE_DUOTONE = "ff-check-square-duotone";
const CHECK_SQUARE_DUOTONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z" /><g fill="currentColor"><path d="M12 22c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22" opacity=".5"/><path d="M16.03 8.97a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l4.47-4.47a.75.75 0 0 1 1.06 0"/></g></svg>`;

/** Same archive-box glyph storyForge registers as `sf-archive-filled` (Story Context Archive tab). */
const ICON_ARCHIVE_FILLED = "sf-archive-filled";
const ARCHIVE_FILLED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M3.955 2.25h16.09c.433 0 .83 0 1.152.043c.356.048.731.16 1.04.47s.422.684.47 1.04c.043.323.043.72.043 1.152v.09c0 .433 0 .83-.043 1.152c-.048.356-.16.731-.47 1.04c-.293.294-.647.41-.987.462v5.357c0 1.838 0 3.294-.153 4.433c-.158 1.172-.49 2.121-1.238 2.87c-.749.748-1.698 1.08-2.87 1.238c-1.14.153-2.595.153-4.433.153h-1.112c-1.838 0-3.294 0-4.433-.153c-1.172-.158-2.121-.49-2.87-1.238c-.748-.749-1.08-1.698-1.238-2.87c-.153-1.14-.153-2.595-.153-4.433V7.7c-.34-.052-.694-.168-.987-.462c-.31-.309-.422-.684-.47-1.04c-.043-.323-.043-.72-.043-1.152v-.09c0-.433 0-.83.043-1.152c.048-.356.16-.731.47-1.04s.684-.422 1.04-.47c.323-.043.72-.043 1.152-.043m.295 5.5V13c0 1.907.002 3.262.14 4.29c.135 1.005.389 1.585.812 2.008s1.003.677 2.009.812c1.028.138 2.382.14 4.289.14h1c1.907 0 3.262-.002 4.29-.14c1.005-.135 1.585-.389 2.008-.812s.677-1.003.812-2.009c.138-1.027.14-2.382.14-4.289V7.75zM2.823 3.823l.003-.001l.01-.005a.7.7 0 0 1 .167-.037c.21-.028.504-.03.997-.03h16c.493 0 .787.002.997.03a.7.7 0 0 1 .177.042l.003.001l.001.003l.005.01c.009.022.024.07.037.167c.028.21.03.504.03.997s-.002.787-.03.997a.7.7 0 0 1-.042.177l-.001.003l-.003.001l-.01.005a.7.7 0 0 1-.167.037c-.21.028-.504.03-.997.03H4c-.493 0-.787-.002-.997-.03a.7.7 0 0 1-.177-.042l-.003-.001l-.001-.003l-.005-.01a.7.7 0 0 1-.037-.167c-.028-.21-.03-.504-.03-.997s.002-.787.03-.997a.7.7 0 0 1 .042-.177zm7.655 5.927h3.044c.214 0 .41 0 .576.011c.178.012.373.04.572.122c.428.178.77.519.947.947c.082.199.11.394.122.572c.011.165.011.362.011.576v.044c0 .214 0 .41-.011.576c-.012.178-.04.373-.122.572a1.75 1.75 0 0 1-.947.947c-.199.082-.394.11-.572.122c-.165.011-.362.011-.576.011h-3.044c-.214 0-.41 0-.576-.011a1.8 1.8 0 0 1-.572-.122a1.75 1.75 0 0 1-.947-.947a1.8 1.8 0 0 1-.122-.572a9 9 0 0 1-.011-.576v-.044c0-.214 0-.41.011-.576c.012-.178.04-.373.122-.572a1.75 1.75 0 0 1 .947-.947c.199-.082.394-.11.572-.122c.165-.011.362-.011.576-.011m-.577 1.52a.25.25 0 0 0-.13.131a1 1 0 0 0-.013.103A8 8 0 0 0 9.75 12c0 .243 0 .388.008.496c.004.067.01.095.012.103a.25.25 0 0 0 .131.13a1 1 0 0 0 .103.013c.108.008.253.008.496.008h3c.243 0 .388 0 .496-.008a1 1 0 0 0 .103-.012a.25.25 0 0 0 .13-.131a1 1 0 0 0 .013-.103c.008-.108.008-.253.008-.496s0-.388-.008-.496a1 1 0 0 0-.012-.103a.25.25 0 0 0-.131-.13a1 1 0 0 0-.103-.013a8 8 0 0 0-.496-.008h-3c-.243 0-.388 0-.496.008a1 1 0 0 0-.103.012" clip-rule="evenodd" /></svg>`;

type ImportSource = {
	kind: "theme" | "backup" | "paste";
	path: string;
	name: string;
};

class ConfirmationModal extends Modal {
	private settled = false;

	constructor(
		app: App,
		private readonly heading: string,
		private readonly message: string,
		private readonly confirmLabel: string,
		private readonly resolve: (value: boolean) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(this.heading);
		this.contentEl.createEl("p", { text: this.message });
		new Setting(this.contentEl)
			.addButton((button) => button.setButtonText("Cancel").onClick(() => this.finish(false)))
			.addButton((button) =>
				button
					.setButtonText(this.confirmLabel)
					.setDestructive()
					.setCta()
					.onClick(() => this.finish(true)),
			);
	}

	onClose(): void {
		if (!this.settled) this.resolve(false);
	}

	private finish(value: boolean): void {
		this.settled = true;
		this.resolve(value);
		this.close();
	}
}

type ThemeEdit = { name: string; description: string };

class EditThemeModal extends Modal {
	private settled = false;
	private name: string;
	private description: string;

	constructor(
		app: App,
		initialName: string,
		initialDescription: string,
		private readonly resolve: (value: ThemeEdit | null) => void,
	) {
		super(app);
		this.name = initialName;
		this.description = initialDescription;
	}

	onOpen(): void {
		addIcon(ICON_EDIT, EDIT_SVG);
		addIcon(ICON_CLOSE_SQUARE_DUOTONE, CLOSE_SQUARE_DUOTONE_SVG);
		this.modalEl.addClass("ff-edit-theme-modal");
		this.titleEl.setText("edit theme");
		this.contentEl.addClass("ff-edit-theme-body");

		const fieldsBox = this.contentEl.createDiv({ cls: "ff-formatting-box ff-json-import-fields" });
		new Setting(fieldsBox).setName("name").addText((text) =>
			text.setValue(this.name).onChange((value) => {
				this.name = value;
			}),
		);
		new Setting(fieldsBox).setName("description").addText((text) =>
			text.setValue(this.description).onChange((value) => {
				this.description = value;
			}),
		);

		const actionBox = this.contentEl.createDiv({ cls: "ff-formatting-box ff-json-import-save" });
		renderHoverIcon(actionBox, ICON_EDIT, "save theme", () =>
			this.finish({ name: this.name, description: this.description }),
		);
		renderHoverIcon(actionBox, ICON_CLOSE_SQUARE_DUOTONE, "cancel", () => this.finish(null));
	}

	onClose(): void {
		if (!this.settled) this.resolve(null);
	}

	private finish(value: ThemeEdit | null): void {
		this.settled = true;
		this.resolve(value);
		this.close();
	}
}

function confirmAction(
	app: App,
	heading: string,
	message: string,
	confirmLabel: string,
): Promise<boolean> {
	return new Promise((resolve) => {
		new ConfirmationModal(app, heading, message, confirmLabel, resolve).open();
	});
}

function promptToEditTheme(
	app: App,
	initialName: string,
	initialDescription: string,
): Promise<ThemeEdit | null> {
	return new Promise((resolve) => {
		new EditThemeModal(app, initialName, initialDescription, resolve).open();
	});
}

function renderHoverIcon(
	parent: HTMLElement,
	icon: string,
	label: string,
	onClick: () => void,
): void {
	const iconEl = parent.createSpan({
		cls:
			icon === ICON_EDIT
				? "ff-formatting-hover-icon ff-formatting-hover-icon--stroke"
				: "ff-formatting-hover-icon",
		attr: { role: "button", tabindex: "0", "aria-label": label },
	});
	setIcon(iconEl, icon);
	iconEl.addEventListener("click", onClick);
	iconEl.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onClick();
		}
	});
}

class JsonImportModal extends Modal {
	private json = "";
	private name = "";
	private description = "";

	constructor(
		app: App,
		private readonly onSave: (name: string, description: string, json: string) => Promise<boolean>,
	) {
		super(app);
	}

	onOpen(): void {
		addIcon(ICON_FLOPPY_DUOTONE, FLOPPY_DUOTONE_SVG);
		this.modalEl.addClass("ff-json-import-modal");
		this.titleEl.remove();
		const { contentEl } = this;
		contentEl.addClass("ff-json-import-modal");

		const fieldsBox = contentEl.createDiv({ cls: "ff-formatting-box ff-json-import-fields" });
		new Setting(fieldsBox)
			.setName("theme name")
			.addText((text) =>
				text.setPlaceholder("e.g. nord or today's theme").onChange((value) => {
					this.name = value;
				}),
			);
		new Setting(fieldsBox)
			.setName("description")
			.addText((text) =>
				text.setPlaceholder("e.g. dark theme for late-night writing").onChange((value) => {
					this.description = value;
				}),
			);

		const pasteBox = contentEl.createDiv({ cls: "ff-formatting-box ff-json-import-paste" });
		pasteBox.createEl("textarea", {
			cls: "ff-formatting-import-text",
			attr: {
				placeholder: "paste formatforge settings JSON here…",
				spellcheck: "false",
			},
		}).addEventListener("input", (event) => {
			this.json = (event.target as HTMLTextAreaElement).value;
		});

		const saveBox = contentEl.createDiv({ cls: "ff-formatting-box ff-json-import-save" });
		const saveBtn = saveBox.createSpan({
			cls: "ff-formatting-hover-icon",
			attr: { role: "button", tabindex: "0", "aria-label": "save theme" },
		});
		setIcon(saveBtn, ICON_FLOPPY_DUOTONE);
		const save = () => void this.submit();
		saveBtn.addEventListener("click", save);
		saveBtn.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				save();
			}
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async submit(): Promise<void> {
		const saved = await this.onSave(this.name, this.description, this.json);
		if (saved) this.close();
	}
}

export class FormattingExportModal extends Modal {
	private readonly plugin: FormatForgePlugin;
	private themeName = "";
	private description = "";
	private exportIncluded: FormattingExportSelection = {
		textStyling: true,
		storyForgeInterface: true,
		palette: true,
	};
	private archiveDatedCopy = false;
	private showExportJson = false;
	private selectedSource: ImportSource | null = null;
	private importText = "";
	private importDocument: FormattingExportDocument | null = null;
	private importIncluded: FormattingExportSelection = {
		textStyling: true,
		storyForgeInterface: true,
		palette: true,
	};
	private activeTabId: "create" | "load" = "create";
	/**
	 * Bumped on every render. Async work started by a render checks the token before
	 * touching the UI, so results arriving after a re-render (or after the modal closed,
	 * or after storyForge disconnected) are discarded instead of writing to dead controls.
	 */
	private renderToken = 0;
	private closed = false;

	constructor(app: App, plugin: FormatForgePlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		addIcon(ICON_FLOPPY_DUOTONE, FLOPPY_DUOTONE_SVG);
		addIcon(ICON_EYE_DUOTONE, EYE_DUOTONE_SVG);
		addIcon(ICON_COPY_FILLED, COPY_FILLED_SVG);
		addIcon(ICON_DOWNLOAD_DUOTONE, DOWNLOAD_DUOTONE_SVG);
		addIcon(ICON_EDIT, EDIT_SVG);
		addIcon(ICON_CLOSE_SQUARE_DUOTONE, CLOSE_SQUARE_DUOTONE_SVG);
		addIcon(ICON_CHECK_SQUARE_DUOTONE, CHECK_SQUARE_DUOTONE_SVG);
		addIcon(ICON_ARCHIVE_FILLED, ARCHIVE_FILLED_SVG);
		this.modalEl.addClass("ff-formatting-export-modal");
		this.titleEl.remove();
		this.render();
	}

	onClose(): void {
		this.closed = true;
		this.renderToken++;
		this.contentEl.empty();
	}

	private currentDocument(): FormattingExportDocument {
		const sfApi = this.plugin.getStoryForgeApi();
		return buildFormattingExport(
			this.plugin.getTypedSettings(),
			sfApi?.getLinkedSettings() ?? null,
			new Date(),
			{
				description: this.description,
				included: {
					...this.exportIncluded,
					storyForgeInterface:
						this.exportIncluded.storyForgeInterface && sfApi !== null,
				},
			},
		);
	}

	/** True while the given render pass is still the one on screen. */
	private isCurrentRender(token: number): boolean {
		return !this.closed && token === this.renderToken;
	}

	private render(): void {
		const { contentEl } = this;
		const token = ++this.renderToken;
		contentEl.empty();
		contentEl.addClass("ff-formatting-export-modal");
		// Re-read the API on every render: storyForge can connect or disconnect while
		// this modal is open, and the twinned controls must follow.
		const sfApi = this.plugin.getStoryForgeApi();
		const tabs: StyleModalTab[] = [
			{
				id: "create",
				label: "create",
				render: (body) => this.renderCreateTab(body, sfApi),
			},
			{
				id: "load",
				label: "load",
				render: (body) => this.renderLoadTab(body, sfApi, token),
			},
		];
		renderTabbedBody(contentEl, tabs, {
			initialId: this.activeTabId,
			onActivate: (id) => {
				this.activeTabId = id === "load" ? "load" : "create";
			},
		});
	}

	private renderCreateTab(contentEl: HTMLElement, sfApi: SfFormattingApi | null): void {
		const exportText = stringifyFormattingExport(this.currentDocument());
		const canArchive = hostSupportsBackupExports(sfApi);

		const includeBox = contentEl.createDiv({ cls: "ff-formatting-box" });
		this.renderSectionToggles(includeBox, {
			textStyling: {
				value: this.exportIncluded.textStyling,
				onChange: (value) => {
					this.exportIncluded.textStyling = value;
					this.render();
				},
			},
			storyForgeInterface: {
				value: this.exportIncluded.storyForgeInterface && sfApi !== null,
				disabled: sfApi === null,
				onChange: (value) => {
					this.exportIncluded.storyForgeInterface = value;
					this.render();
				},
			},
			palette: {
				value: this.exportIncluded.palette,
				onChange: (value) => {
					this.exportIncluded.palette = value;
					this.render();
				},
			},
			archive: {
				value: this.archiveDatedCopy,
				disabled: !canArchive,
				onChange: (value) => {
					this.archiveDatedCopy = value;
				},
			},
		});

		if (hostSupportsThemeLibrary(sfApi)) {
			const saveBox = contentEl.createDiv({ cls: "ff-formatting-box ff-formatting-save-box" });
			const fields = saveBox.createDiv({ cls: "ff-formatting-save-fields" });
			new Setting(fields)
				.setName("theme name")
				.addText((text) =>
					text
						.setPlaceholder("e.g. nord or today's theme")
						.setValue(this.themeName)
						.onChange((value) => {
							this.themeName = value;
						}),
				);
			new Setting(fields)
				.setName("description")
				.addText((text) =>
					text
						.setPlaceholder("e.g. dark theme for late-night writing")
						.setValue(this.description)
						.onChange((value) => {
							this.description = value;
						}),
				);
			const saveAction = saveBox.createDiv({ cls: "ff-formatting-save-action" });
			renderHoverIcon(saveAction, ICON_FLOPPY_DUOTONE, "save theme", () => void this.saveTheme(false));
		} else {
			const saveBox = contentEl.createDiv({ cls: "ff-formatting-box" });
			new Setting(saveBox).setName("named themes");
		}

		const jsonBox = contentEl.createDiv({ cls: "ff-formatting-box" });
		const jsonSetting = new Setting(jsonBox).setName("share as JSON");
		renderHoverIcon(jsonSetting.controlEl, ICON_COPY_FILLED, "copy JSON", () =>
			void this.copyText(stringifyFormattingExport(this.currentDocument())),
		);
		renderHoverIcon(
			jsonSetting.controlEl,
			ICON_EYE_DUOTONE,
			this.showExportJson ? "hide JSON" : "show JSON",
			() => {
				this.showExportJson = !this.showExportJson;
				this.render();
			},
		);
		if (this.showExportJson) {
			const exportTextarea = jsonBox.createEl("textarea", {
				cls: "ff-formatting-export-text",
				attr: { readonly: "true", spellcheck: "false" },
			});
			exportTextarea.value = exportText;
		}
	}

	private renderLoadTab(
		contentEl: HTMLElement,
		sfApi: SfFormattingApi | null,
		token: number,
	): void {
		const pickerBox = contentEl.createDiv({ cls: "ff-formatting-box" });
		this.renderSourcePicker(pickerBox, sfApi, token);

		const previewBox = contentEl.createDiv({
			cls: "ff-formatting-box ff-formatting-preview-box",
		});
		this.renderImportPreview(previewBox, sfApi);

		const importBox = contentEl.createDiv({ cls: "ff-formatting-box" });
		const importSetting = new Setting(importBox).setName("JSON import");
		renderHoverIcon(importSetting.controlEl, ICON_DOWNLOAD_DUOTONE, "import JSON", () =>
			this.openJsonImportModal(),
		);
	}

	private renderSectionToggles(
		parent: HTMLElement,
		toggles: {
			textStyling: { value: boolean; disabled?: boolean; onChange: (value: boolean) => void };
			storyForgeInterface: { value: boolean; disabled?: boolean; onChange: (value: boolean) => void };
			palette: { value: boolean; disabled?: boolean; onChange: (value: boolean) => void };
			archive?: { value: boolean; disabled?: boolean; onChange: (value: boolean) => void };
		},
	): void {
		const row = parent.createDiv({ cls: "ff-formatting-toggle-row" });
		const cells: Array<{
			name: string;
			spec: { value: boolean; disabled?: boolean; onChange: (value: boolean) => void };
		}> = [
			{ name: "text styling", spec: toggles.textStyling },
			{ name: "storyforge interface", spec: toggles.storyForgeInterface },
			{ name: "palette", spec: toggles.palette },
		];
		if (toggles.archive) {
			cells.push({ name: "archive dated copy", spec: toggles.archive });
		}
		for (const cell of cells) {
			new Setting(row).setName(cell.name).addToggle((toggle) =>
				toggle
					.setValue(cell.spec.value)
					.setDisabled(cell.spec.disabled ?? false)
					.onChange(cell.spec.onChange),
			);
		}
	}

	private renderSourcePicker(
		contentEl: HTMLElement,
		sfApi: SfFormattingApi | null,
		token: number,
	): void {
		if (!hostSupportsThemeLibrary(sfApi) && !hostSupportsBackupExports(sfApi)) {
			new Setting(contentEl)
				.setName("theme library")
				.setDesc("available when a compatible storyforge is connected.");
			return;
		}

		if (hostSupportsThemeLibrary(sfApi)) {
			new Setting(contentEl).setName("choose a theme").addDropdown((dropdown) =>
				this.bindSourceDropdown(
					dropdown,
					token,
					"theme",
					"choose a theme…",
					sfApi.listFormattingPresets!(),
					(path) => sfApi.readFormattingPreset!(path),
				),
			);
		} else {
			new Setting(contentEl)
				.setName("choose a theme")
				.setDesc("available when a compatible storyforge is connected.");
		}

		if (hostSupportsBackupExports(sfApi)) {
			new Setting(contentEl).setName("load a backed up theme").addDropdown((dropdown) =>
				this.bindSourceDropdown(
					dropdown,
					token,
					"backup",
					"load a backed up theme…",
					sfApi.listSettingsExports!().then((files) =>
						files.filter((file) => file.name.endsWith("formatForge settings.json")),
					),
					(path) => sfApi.readSettingsExport!(path),
				),
			);
		} else {
			new Setting(contentEl)
				.setName("load a backed up theme")
				.setDesc("available when a compatible storyforge is connected.");
		}
	}

	private bindSourceDropdown(
		dropdown: DropdownComponent,
		token: number,
		kind: "theme" | "backup",
		placeholder: string,
		listPromise: Promise<Array<{ path: string; name: string }>>,
		read: (path: string) => Promise<string>,
	): void {
		dropdown.addOption("", placeholder);
		void listPromise
			.then((items) => {
				// Listing is async; a newer render (or a close) owns the UI by now.
				if (!this.isCurrentRender(token)) return;
				for (const item of items) {
					dropdown.addOption(item.path, item.name);
				}
				const selected = this.selectedSource;
				if (selected?.kind === kind) dropdown.setValue(selected.path);
				if (items.length === 0) dropdown.setDisabled(true);
			})
			.catch(() => {
				if (this.isCurrentRender(token)) dropdown.setDisabled(true);
			});
		dropdown.onChange((value) => {
			if (!value) return;
			void read(value)
				.then((text) => {
					if (!this.isCurrentRender(token)) return;
					this.loadImportText(text, {
						kind,
						path: value,
						name: value.slice(value.lastIndexOf("/") + 1).replace(/\.json$/i, ""),
					});
				})
				.catch((error: unknown) => {
					new Notice(
						`formatForge: could not read settings — ${
							error instanceof Error ? error.message : String(error)
						}`,
					);
				});
		});
	}

	private renderImportPreview(contentEl: HTMLElement, sfApi: SfFormattingApi | null): void {
		const document = this.importDocument;
		if (!document) {
			contentEl.createDiv({
				cls: "ff-formatting-import-preview is-empty",
				text: "choose a theme or a backed up theme to preview it before applying.",
			});
			return;
		}

		const copy = contentEl.createDiv({ cls: "ff-formatting-preview-copy" });
		copy.createEl("strong", {
			cls: "ff-formatting-preview-title",
			text: this.selectedSource?.name ?? "formatting settings",
		});
		copy.createDiv({
			cls: "ff-formatting-preview-description",
			text: document.description ?? "",
		});

		const controls = contentEl.createDiv({ cls: "ff-formatting-preview-controls" });
		controls.createDiv({
			cls: "ff-formatting-import-meta",
			text: `saved: ${new Date(document.exportedAt).toLocaleString()}`,
		});

		this.renderSectionToggles(controls, {
			textStyling: {
				value: this.importIncluded.textStyling,
				disabled: document.textStyling === null,
				onChange: (value) => {
					this.importIncluded.textStyling = value;
				},
			},
			storyForgeInterface: {
				value: this.importIncluded.storyForgeInterface && sfApi !== null,
				disabled: document.storyForgeInterface === null || sfApi === null,
				onChange: (value) => {
					this.importIncluded.storyForgeInterface = value;
				},
			},
			palette: {
				value: this.importIncluded.palette,
				disabled: document.palette === null,
				onChange: (value) => {
					this.importIncluded.palette = value;
				},
			},
		});
		const applyRow = controls.createDiv({ cls: "ff-formatting-preview-apply" });
		const actions = applyRow.createDiv({ cls: "ff-formatting-preview-actions" });
		renderHoverIcon(actions, ICON_CHECK_SQUARE_DUOTONE, "apply theme", () => void this.applyImport());
		if (this.selectedSource?.kind === "theme" && hostSupportsPresetManagement(sfApi)) {
			renderHoverIcon(actions, ICON_EDIT, "edit theme", () => void this.editTheme());
			renderHoverIcon(actions, ICON_ARCHIVE_FILLED, "archive theme", () => void this.archiveTheme());
		}
	}

	private loadImportText(text: string, source: ImportSource): void {
		try {
			const document = parseFormattingExport(text);
			this.importText = text;
			this.importDocument = document;
			this.selectedSource = source;
			this.importIncluded = {
				textStyling: document.textStyling !== null,
				storyForgeInterface: document.storyForgeInterface !== null,
				palette: document.palette !== null,
			};
			this.render();
		} catch (error: unknown) {
			new Notice(
				`formatForge: could not preview formatting — ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private openJsonImportModal(): void {
		if (!this.requireThemeHost()) return;
		new JsonImportModal(this.app, (name, description, json) =>
			this.importJsonAsTheme(name, description, json),
		).open();
	}

	private async importJsonAsTheme(
		name: string,
		description: string,
		json: string,
	): Promise<boolean> {
		let document: FormattingExportDocument;
		try {
			document = parseFormattingExport(json);
		} catch (error: unknown) {
			new Notice(
				`formatForge: could not import formatting — ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
			return false;
		}
		const trimmed = description.trim();
		const exportText = stringifyFormattingExport(
			trimmed ? { ...document, description: trimmed } : document,
		);
		const file = await this.persistNamedTheme(name, exportText, false);
		if (!file) return false;
		this.loadImportText(exportText, { kind: "theme", path: file.path, name: file.name });
		return true;
	}

	private async persistNamedTheme(
		name: string,
		exportText: string,
		overwrite: boolean,
	): Promise<{ path: string; name: string } | null> {
		const sfApi = this.requireThemeHost();
		if (!sfApi?.saveFormattingPreset) return null;
		try {
			return await sfApi.saveFormattingPreset(name, exportText, overwrite);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			if (!overwrite && message.includes("already exists")) {
				const confirmed = await confirmAction(
					this.app,
					"Replace theme?",
					`${message}. Replace it with the imported settings?`,
					"Replace",
				);
				if (confirmed) return this.persistNamedTheme(name, exportText, true);
				return null;
			}
			new Notice(`formatForge: could not save theme — ${message}`);
			return null;
		}
	}

	private requireThemeHost(): SfFormattingApi | null {
		const sfApi = this.plugin.getStoryForgeApi();
		if (hostSupportsThemeLibrary(sfApi)) return sfApi;
		new Notice("formatForge: storyForge is no longer connected, so themes cannot be managed");
		this.render();
		return null;
	}

	private async saveTheme(overwrite: boolean): Promise<void> {
		const sfApi = this.requireThemeHost();
		if (!sfApi?.saveFormattingPreset) return;
		const exportText = stringifyFormattingExport(this.currentDocument());
		try {
			const file = await sfApi.saveFormattingPreset(this.themeName, exportText, overwrite);
			if (this.archiveDatedCopy && sfApi.saveFormattingExport) {
				try {
					await sfApi.saveFormattingExport(exportText);
					new Notice(`formatForge: theme "${file.name}" saved and archived`);
				} catch (archiveError: unknown) {
					new Notice(
						`formatForge: theme "${file.name}" saved, but archive failed — ${
							archiveError instanceof Error
								? archiveError.message
								: String(archiveError)
						}`,
					);
				}
			} else {
				new Notice(`formatForge: theme "${file.name}" saved`);
			}
			this.themeName = file.name;
			this.render();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			if (!overwrite && message.includes("already exists")) {
				const confirmed = await confirmAction(
					this.app,
					"Replace theme?",
					`${message}. Replace it with the current settings?`,
					"Replace",
				);
				if (confirmed) await this.saveTheme(true);
				return;
			}
			new Notice(`formatForge: could not save theme — ${message}`);
		}
	}

	private async editTheme(): Promise<void> {
		const source = this.selectedSource;
		const document = this.importDocument;
		const sfApi = this.requireThemeHost();
		if (source?.kind !== "theme" || !document || !sfApi?.renameFormattingPreset || !sfApi.saveFormattingPreset) {
			return;
		}
		const currentName = source.name.replace(/\.json$/i, "");
		const edited = await promptToEditTheme(this.app, currentName, document.description ?? "");
		if (edited === null) return;
		const nextName = edited.name.trim();
		if (!nextName) {
			new Notice("formatForge: enter a name for this theme");
			return;
		}
		const trimmedDescription = edited.description.trim();
		const updated: FormattingExportDocument = { ...document };
		if (trimmedDescription) updated.description = trimmedDescription;
		else delete updated.description;
		const exportText = stringifyFormattingExport(updated);

		let name = currentName;
		if (nextName !== currentName) {
			try {
				const renamed = await sfApi.renameFormattingPreset(source.path, nextName, false);
				name = renamed.name;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				if (!message.includes("already exists")) {
					new Notice(`formatForge: could not edit theme — ${message}`);
					return;
				}
				const confirmed = await confirmAction(
					this.app,
					"Replace theme?",
					`${message}. Replace it during rename?`,
					"Replace",
				);
				if (!confirmed) return;
				const renamed = await sfApi.renameFormattingPreset(source.path, nextName, true);
				name = renamed.name;
			}
		}

		try {
			const saved = await sfApi.saveFormattingPreset(name, exportText, true);
			this.loadImportText(exportText, { kind: "theme", path: saved.path, name: saved.name });
			new Notice(`formatForge: theme "${saved.name}" updated`);
		} catch (error: unknown) {
			new Notice(
				`formatForge: could not edit theme — ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private async archiveTheme(): Promise<void> {
		const source = this.selectedSource;
		const sfApi = this.requireThemeHost();
		if (source?.kind !== "theme" || !sfApi?.deleteFormattingPreset) return;
		const confirmed = await confirmAction(
			this.app,
			"Archive theme?",
			`Move "${source.name}" to archived-settings?`,
			"Archive",
		);
		if (!confirmed) return;
		try {
			await sfApi.deleteFormattingPreset(source.path);
			this.selectedSource = null;
			this.importDocument = null;
			this.importText = "";
			new Notice(`formatForge: theme "${source.name}" archived`);
			this.render();
		} catch (error: unknown) {
			new Notice(
				`formatForge: could not archive theme — ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private async applyImport(): Promise<void> {
		const document = this.importDocument;
		if (!document) return;
		try {
			const rejected = await applyFormattingDocument(
				this.plugin,
				document,
				this.importIncluded,
			);
			if (rejected.length > 0) {
				new Notice(
					`formatForge: theme applied; ignored ${rejected.length} invalid value(s): ${rejected
						.slice(0, 4)
						.join(", ")}`,
				);
			} else {
				new Notice("formatForge: selected theme sections applied");
			}
			this.render();
		} catch (error: unknown) {
			new Notice(
				`formatForge: could not apply theme — ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private async copyText(text: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			new Notice("formatForge: formatting JSON copied");
		} catch {
			this.showExportJson = true;
			this.render();
			new Notice("formatForge: JSON shown — use your normal copy command");
		}
	}
}
