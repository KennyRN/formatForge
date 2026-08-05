import { App, Modal, Notice, Setting } from "obsidian";
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

class NamePromptModal extends Modal {
	private settled = false;
	private value: string;

	constructor(
		app: App,
		heading: string,
		initialValue: string,
		private readonly resolve: (value: string | null) => void,
	) {
		super(app);
		this.value = initialValue;
		this.titleEl.setText(heading);
	}

	onOpen(): void {
		new Setting(this.contentEl).setName("Name").addText((text) =>
			text.setValue(this.value).onChange((value) => {
				this.value = value;
			}),
		);
		new Setting(this.contentEl)
			.addButton((button) => button.setButtonText("Cancel").onClick(() => this.finish(null)))
			.addButton((button) =>
				button.setButtonText("Rename").setCta().onClick(() => this.finish(this.value)),
			);
	}

	onClose(): void {
		if (!this.settled) this.resolve(null);
	}

	private finish(value: string | null): void {
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

function promptForName(app: App, heading: string, initialValue: string): Promise<string | null> {
	return new Promise((resolve) => {
		new NamePromptModal(app, heading, initialValue, resolve).open();
	});
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
	private showPasteJson = false;
	private selectedSource: ImportSource | null = null;
	private importText = "";
	private importDocument: FormattingExportDocument | null = null;
	private importIncluded: FormattingExportSelection = {
		textStyling: true,
		storyForgeInterface: true,
		palette: true,
	};
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
		this.modalEl.addClass("ff-formatting-export-modal");
		this.titleEl.setText("Formatting themes");
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
		// Re-read the API on every render: storyForge can connect or disconnect while
		// this modal is open, and the twinned controls must follow.
		const sfApi = this.plugin.getStoryForgeApi();
		this.renderBody(contentEl, sfApi, token);
	}

	private renderBody(
		contentEl: HTMLElement,
		sfApi: SfFormattingApi | null,
		token: number,
	): void {
		const exportText = stringifyFormattingExport(this.currentDocument());

		contentEl.createEl("h3", { text: "Save or share" });
		contentEl.createEl("p", {
			cls: "ff-formatting-export-description",
			text: "Save a reusable named theme. JSON remains available as a fallback for sharing outside this vault.",
		});

		new Setting(contentEl)
			.setName("Include in theme")
			.setDesc("Choose which sections are saved.")
			.addToggle((toggle) =>
				toggle
					.setTooltip("Text styling")
					.setValue(this.exportIncluded.textStyling)
					.onChange((value) => {
						this.exportIncluded.textStyling = value;
						this.render();
					}),
			)
			.addToggle((toggle) =>
				toggle
					.setTooltip("storyForge interface")
					.setValue(this.exportIncluded.storyForgeInterface && sfApi !== null)
					.setDisabled(sfApi === null)
					.onChange((value) => {
						this.exportIncluded.storyForgeInterface = value;
						this.render();
					}),
			)
			.addToggle((toggle) =>
				toggle
					.setTooltip("Palette")
					.setValue(this.exportIncluded.palette)
					.onChange((value) => {
						this.exportIncluded.palette = value;
						this.render();
					}),
			);
		contentEl.createDiv({
			cls: "ff-formatting-section-labels",
			text: `Text styling: ${this.exportIncluded.textStyling ? "yes" : "no"} · Interface: ${
				this.exportIncluded.storyForgeInterface && sfApi ? "yes" : "no"
			} · Palette: ${this.exportIncluded.palette ? "yes" : "no"}`,
		});

		if (hostSupportsThemeLibrary(sfApi)) {
			new Setting(contentEl)
				.setName("Theme name")
				.setDesc("Saving an existing name asks before replacing it.")
				.addText((text) =>
					text
						.setPlaceholder("e.g. Nord or Today's Theme")
						.setValue(this.themeName)
						.onChange((value) => {
							this.themeName = value;
						}),
				);
			new Setting(contentEl)
				.setName("Description")
				.setDesc("Optional note shown before this theme is applied.")
				.addText((text) =>
					text
						.setPlaceholder("e.g. Dark theme for late-night writing")
						.setValue(this.description)
						.onChange((value) => {
							this.description = value;
						}),
				);
			new Setting(contentEl)
				.setName("Archive dated copy")
				.setDesc("Also saves a timestamped snapshot under _sf-backup/.")
				.addToggle((toggle) =>
					toggle.setValue(this.archiveDatedCopy).onChange((value) => {
						this.archiveDatedCopy = value;
					}),
				)
				.addButton((button) =>
					button.setButtonText("Save theme").setCta().onClick(() => {
						void this.saveTheme(false);
					}),
				);
		} else {
			new Setting(contentEl)
				.setName("Named themes")
				.setDesc("Connect storyForge to save reusable themes inside this vault.");
		}

		new Setting(contentEl)
			.setName("Share as JSON")
			.setDesc("Copy the selected sections for pasting into another vault.")
			.addButton((button) =>
				button.setButtonText("Copy JSON").onClick(() =>
					void this.copyText(stringifyFormattingExport(this.currentDocument())),
				),
			)
			.addButton((button) =>
				button.setButtonText(this.showExportJson ? "Hide JSON" : "Show JSON").onClick(() => {
					this.showExportJson = !this.showExportJson;
					this.render();
				}),
			);
		if (this.showExportJson) {
			const exportTextarea = contentEl.createEl("textarea", {
				cls: "ff-formatting-export-text",
				attr: { readonly: "true", spellcheck: "false" },
			});
			exportTextarea.value = exportText;
		}

		contentEl.createEl("h3", { text: "Load a theme" });
		this.renderSourcePicker(contentEl, sfApi, token);
		this.renderImportPreview(contentEl, sfApi);

		new Setting(contentEl)
			.setName("JSON fallback")
			.setDesc("Use this only when someone has sent you settings as text.")
			.addButton((button) =>
				button.setButtonText(this.showPasteJson ? "Hide paste box" : "Paste JSON…").onClick(() => {
					this.showPasteJson = !this.showPasteJson;
					this.render();
				}),
			);
		if (this.showPasteJson) {
			const importTextarea = contentEl.createEl("textarea", {
				cls: "ff-formatting-import-text",
				attr: {
					placeholder: "Paste formatForge settings JSON here…",
					spellcheck: "false",
				},
			});
			importTextarea.value = this.selectedSource?.kind === "paste" ? this.importText : "";
			importTextarea.addEventListener("input", () => {
				this.importText = importTextarea.value;
			});
			new Setting(contentEl).addButton((button) =>
				button.setButtonText("Preview pasted JSON").onClick(() => {
					this.loadImportText(this.importText, {
						kind: "paste",
						path: "",
						name: "Pasted JSON",
					});
				}),
			);
		}
	}

	private renderSourcePicker(
		contentEl: HTMLElement,
		sfApi: SfFormattingApi | null,
		token: number,
	): void {
		if (!hostSupportsThemeLibrary(sfApi) || !hostSupportsBackupExports(sfApi)) {
			new Setting(contentEl)
				.setName("Theme library")
				.setDesc("Available when a compatible storyForge is connected.");
			return;
		}
		const host = sfApi;

		const picker = new Setting(contentEl)
			.setName("Theme library")
			.setDesc("Named themes and dated backup snapshots are grouped in one list.");
		picker.addDropdown((dropdown) => {
			dropdown.addOption("", "Choose a theme or backup…");
			void Promise.all([host.listFormattingPresets!(), host.listSettingsExports!()])
				.then(([themes, backups]) => {
					// Listing is async; a newer render (or a close) owns the UI by now.
					if (!this.isCurrentRender(token)) return;
					for (const theme of themes) {
						dropdown.addOption(`theme:${theme.path}`, `Theme — ${theme.name}`);
					}
					for (const backup of backups.filter((file) =>
						file.name.endsWith("formatForge settings.json"),
					)) {
						dropdown.addOption(`backup:${backup.path}`, `Backup — ${backup.name}`);
					}
					const selected = this.selectedSource;
					if (selected && selected.kind !== "paste") {
						dropdown.setValue(`${selected.kind}:${selected.path}`);
					}
					if (themes.length === 0 && backups.length === 0) dropdown.setDisabled(true);
				})
				.catch(() => {
					if (this.isCurrentRender(token)) dropdown.setDisabled(true);
				});
			dropdown.onChange((value) => {
				if (!value) return;
				const separator = value.indexOf(":");
				const kind = value.slice(0, separator) as "theme" | "backup";
				const path = value.slice(separator + 1);
				const reader =
					kind === "theme"
						? host.readFormattingPreset!(path)
						: host.readSettingsExport!(path);
				void reader
					.then((text) => {
						if (!this.isCurrentRender(token)) return;
						this.loadImportText(text, {
							kind,
							path,
							name: path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/i, ""),
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
		});
	}

	private renderImportPreview(contentEl: HTMLElement, sfApi: SfFormattingApi | null): void {
		const document = this.importDocument;
		if (!document) {
			contentEl.createDiv({
				cls: "ff-formatting-import-preview is-empty",
				text: "Choose a theme or backup to preview it before applying.",
			});
			return;
		}

		const preview = contentEl.createDiv({ cls: "ff-formatting-import-preview" });
		preview.createEl("strong", { text: this.selectedSource?.name ?? "Formatting settings" });
		if (document.description) preview.createDiv({ text: document.description });
		preview.createDiv({
			cls: "ff-formatting-import-meta",
			text: `Saved ${new Date(document.exportedAt).toLocaleString()} · ${
				document.textStyling ? Object.keys(document.textStyling).length : 0
			} text settings · ${
				document.storyForgeInterface
					? Object.keys(document.storyForgeInterface).length
					: 0
			} interface settings · ${document.palette ? "palette included" : "no palette"}`,
		});

		new Setting(preview)
			.setName("Apply sections")
			.addToggle((toggle) =>
				toggle
					.setTooltip("Text styling")
					.setValue(this.importIncluded.textStyling)
					.setDisabled(document.textStyling === null)
					.onChange((value) => {
						this.importIncluded.textStyling = value;
					}),
			)
			.addToggle((toggle) =>
				toggle
					.setTooltip("storyForge interface")
					.setValue(this.importIncluded.storyForgeInterface && sfApi !== null)
					.setDisabled(document.storyForgeInterface === null || sfApi === null)
					.onChange((value) => {
						this.importIncluded.storyForgeInterface = value;
					}),
			)
			.addToggle((toggle) =>
				toggle
					.setTooltip("Palette")
					.setValue(this.importIncluded.palette)
					.setDisabled(document.palette === null)
					.onChange((value) => {
						this.importIncluded.palette = value;
					}),
			)
			.addButton((button) =>
				button.setButtonText("Apply theme").setCta().onClick(() => void this.applyImport()),
			);

		if (this.selectedSource?.kind === "theme" && hostSupportsPresetManagement(sfApi)) {
			new Setting(preview)
				.setName("Manage named theme")
				.addButton((button) =>
					button.setButtonText("Rename").onClick(() => void this.renameTheme()),
				)
				.addButton((button) =>
					button.setButtonText("Delete").setDestructive().onClick(() => void this.deleteTheme()),
				);
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

	/**
	 * Storage lives in storyForge, and it can disconnect while this modal is open, so the
	 * live API is re-read at click time rather than captured during render.
	 */
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

	private async renameTheme(): Promise<void> {
		const source = this.selectedSource;
		const sfApi = this.requireThemeHost();
		if (source?.kind !== "theme" || !sfApi?.renameFormattingPreset) return;
		const currentName = source.name.replace(/\.json$/i, "");
		const name = await promptForName(this.app, "Rename theme", currentName);
		if (name === null) return;
		try {
			const renamed = await sfApi.renameFormattingPreset(source.path, name, false);
			this.selectedSource = { kind: "theme", path: renamed.path, name: renamed.name };
			new Notice(`formatForge: theme renamed to "${renamed.name}"`);
			this.render();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.includes("already exists")) {
				const confirmed = await confirmAction(
					this.app,
					"Replace theme?",
					`${message}. Replace it during rename?`,
					"Replace",
				);
				if (confirmed) {
					const renamed = await sfApi.renameFormattingPreset(source.path, name, true);
					this.selectedSource = {
						kind: "theme",
						path: renamed.path,
						name: renamed.name,
					};
					this.render();
				}
				return;
			}
			new Notice(`formatForge: could not rename theme — ${message}`);
		}
	}

	private async deleteTheme(): Promise<void> {
		const source = this.selectedSource;
		const sfApi = this.requireThemeHost();
		if (source?.kind !== "theme" || !sfApi?.deleteFormattingPreset) return;
		const confirmed = await confirmAction(
			this.app,
			"Delete theme?",
			`Move "${source.name}" to the Obsidian trash?`,
			"Delete",
		);
		if (!confirmed) return;
		try {
			await sfApi.deleteFormattingPreset(source.path);
			this.selectedSource = null;
			this.importDocument = null;
			this.importText = "";
			new Notice(`formatForge: theme "${source.name}" deleted`);
			this.render();
		} catch (error: unknown) {
			new Notice(
				`formatForge: could not delete theme — ${
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
