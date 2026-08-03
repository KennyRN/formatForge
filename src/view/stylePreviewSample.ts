/**
 * Classic Lorem Ipsum sample for the Text Styling live preview.
 * Derived from the traditional typesetting placeholder (scrambled Cicero);
 * see Licences - Third Party.md — public domain.
 */
import { setIcon } from "obsidian";

export interface StylePreviewSampleOptions {
	/** When true, inserts a cycling-guide strip mid-document (storyForge chrome). */
	cyclingGuideEnabled?: boolean;
}

function el(parent: HTMLElement, tag: keyof HTMLElementTagNameMap, cls?: string): HTMLElement {
	const node = parent.createEl(tag, cls ? { cls } : undefined);
	return node;
}

function paragraph(
	parent: HTMLElement,
	...parts: Array<string | { bold?: string; italic?: string; link?: string; highlight?: string }>
): void {
	const p = el(parent, "p");
	for (const part of parts) {
		if (typeof part === "string") {
			p.appendText(part);
			continue;
		}
		if (part.bold) p.createEl("strong", { text: part.bold });
		if (part.italic) p.createEl("em", { text: part.italic });
		if (part.link) p.createEl("a", { text: part.link, attr: { href: "#" } });
		if (part.highlight) p.createEl("mark", { text: part.highlight });
	}
}

function mountCyclingGuide(parent: HTMLElement): void {
	const guide = parent.createDiv({ cls: "ff-style-preview-cg sf-cycling-guide-line" });
	guide.createDiv({ cls: "ff-style-preview-cg-spacer", text: " " });
	const badge = guide.createDiv({ cls: "sf-cycling-guide-badge" });
	const badgeIcon = badge.createSpan({ cls: "sf-cycling-guide-badge-icon" });
	setIcon(badgeIcon, "sf-cycle-alt");
}

/** Mounts a short manuscript-shaped Lorem Ipsum document into `container`. */
export function mountStylePreviewSample(container: HTMLElement, opts?: StylePreviewSampleOptions): void {
	container.empty();

	el(container, "h1").setText("Lorem ipsum dolor sit amet");
	paragraph(
		container,
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
		{ bold: "Ut enim ad minim veniam" },
		", quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ",
		{ italic: "Excepteur sint occaecat cupidatat non proident" },
		", sunt in culpa qui officia deserunt mollit anim id est laborum. See also ",
		{ link: "lorem ipsum" },
		" and ",
		{ highlight: "highlighted text" },
		".",
	);
	paragraph(
		container,
		"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
	);

	if (opts?.cyclingGuideEnabled) {
		mountCyclingGuide(container);
	}

	el(container, "h2").setText("Neque porro quisquam est");
	paragraph(
		container,
		"Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
	);

	el(container, "h3").setText("At vero eos et accusamus");
	paragraph(
		container,
		"At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
	);

	el(container, "h4").setText("Et harum quidem rerum");
	paragraph(
		container,
		"Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.",
	);

	el(container, "h5").setText("Temporibus autem quibusdam");
	paragraph(
		container,
		"Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
	);

	el(container, "h6").setText("Quis autem vel eum");
	paragraph(
		container,
		"Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? ",
		{ bold: "Lorem ipsum" },
		" dolor sit amet, ",
		{ italic: "consectetur adipiscing" },
		" elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.",
	);

	paragraph(
		container,
		"Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.",
	);
	paragraph(
		container,
		"Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
	);
}
