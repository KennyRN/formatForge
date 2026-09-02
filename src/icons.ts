import { addIcon } from "obsidian";

/** Qlementine — page-text-16. Text format modal breadcrumb: Body. */
export const ICON_PAGE_TEXT = "sf-page-text";
const PAGE_TEXT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M0 0h16v16H0z" fill="none" /><path fill="currentColor" d="M5 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5M5.5 9a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 12.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5M5.5 3a.5.5 0 0 0 0 1H8V3z"/><path fill="currentColor" fill-rule="evenodd" d="M14 4.57a.5.5 0 0 0-.024-.235l-.013-.063a1.5 1.5 0 0 0-.18-.434c-.092-.15-.222-.28-.482-.54l-2.59-2.59c-.259-.26-.389-.39-.54-.483a1.5 1.5 0 0 0-.496-.193a.5.5 0 0 0-.235-.024C9.329.004 9.194.004 9.015.004h-2.21c-1.68 0-2.52 0-3.16.327a3.02 3.02 0 0 0-1.31 1.31c-.327.642-.327 1.48-.327 3.16v6.4c0 1.68 0 2.52.327 3.16a3.02 3.02 0 0 0 1.31 1.31c.642.327 1.48.327 3.16.327h2.4c1.68 0 2.52 0 3.16-.327a3 3 0 0 0 1.31-1.31c.327-.642.327-1.48.327-3.16V4.99c0-.178 0-.313-.005-.425zm-2.91 10.4c-.45.037-1.03.038-1.89.038H6.8c-.857 0-1.44-.001-1.89-.038c-.438-.036-.663-.101-.819-.18a2 2 0 0 1-.874-.874c-.08-.156-.145-.381-.18-.819c-.037-.45-.038-1.03-.038-1.89v-6.4c0-.857.001-1.44.038-1.89c.036-.438.101-.663.18-.819c.192-.376.498-.682.874-.874c.156-.08.381-.145.819-.18c.45-.037 1.03-.038 1.89-.038H9v3.5a.5.5 0 0 0 .5.5H13v6.2c0 .857 0 1.44-.038 1.89c-.035.438-.1.663-.18.82a2 2 0 0 1-.874.873c-.156.08-.38.145-.819.18zM10 1.47l2.59 2.59H10z" clip-rule="evenodd"/></svg>`;

/** Qlementine — page-portrait-16. Text format modal breadcrumb: Body text. */
export const ICON_PAGE_PORTRAIT = "sf-page-portrait";
const PAGE_PORTRAIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M0 0h16v16H0z" fill="none" /><path fill="currentColor" fill-rule="evenodd" d="M8 6c.233 0 .442.134.525.338l2.44 5.95c.111.271-.034.574-.324.678s-.615-.032-.726-.303l-.665-1.66H6.76l-.665 1.66c-.111.271-.436.406-.726.303s-.435-.407-.324-.678l2.44-5.95A.56.56 0 0 1 8.01 6zm0 1.88L8.847 10h-1.69l.847-2.12z" clip-rule="evenodd"/><path fill="currentColor" fill-rule="evenodd" d="M2.33 1.64c-.327.642-.327 1.48-.327 3.16v6.4c0 1.68 0 2.52.327 3.16a3.02 3.02 0 0 0 1.31 1.31c.642.327 1.48.327 3.16.327h2.4c1.68 0 2.52 0 3.16-.327a3 3 0 0 0 1.31-1.31c.327-.642.327-1.48.327-3.16V4.83c0-.489 0-.734-.055-.964a2 2 0 0 0-.24-.578c-.123-.202-.296-.375-.642-.721L11.43.937c-.346-.346-.52-.519-.721-.643a2 2 0 0 0-.578-.239C9.9 0 9.656 0 9.167 0h-2.37c-1.68 0-2.52 0-3.16.327a3.02 3.02 0 0 0-1.31 1.31zm2.58 13.3c.45.037 1.03.038 1.89.038h2.4c.857 0 1.44-.001 1.89-.038c.438-.036.663-.101.819-.18c.376-.192.682-.498.874-.874c.08-.156.145-.381.18-.819c.037-.45.038-1.03.038-1.89v-6.2H9.5a.5.5 0 0 1-.5-.5v-3.5H6.8c-.857 0-1.44 0-1.89.038c-.438.035-.663.1-.82.18a2 2 0 0 0-.873.874c-.08.156-.145.38-.18.819C3 3.338 3 3.918 3 4.778v6.4c0 .857 0 1.44.038 1.89c.035.438.1.663.18.819c.192.376.498.682.874.874c.156.08.38.145.819.18zm7.94-11.2a1 1 0 0 1 .092.194h-2.94V.994a1 1 0 0 1 .194.092c.077.047.156.117.536.497l1.63 1.63c.38.38.45.459.497.536z" clip-rule="evenodd"/></svg>`;

/** Mingcute — blockquote-line. Text format modal breadcrumb: Quote. */
export const ICON_BLOCKQUOTE = "sf-blockquote";
const BLOCKQUOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M15 6h5m-5 4h5M5 14h15M5 18h15M9.02 9c-.082-.8 0-2.4 1.98-4M4.02 9c-.082-.8 0-2.4 1.98-4m0 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0Z"/></svg>`;

/** Reicon — link2. Text format modal breadcrumb: Links half of Links and lists. */
export const ICON_LINK2 = "sf-link2";
const LINK2_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.99 17.5h1.51c3.02 0 5.5-2.47 5.5-5.5c0-3.02-2.47-5.5-5.5-5.5h-1.51M9 6.5H7.5A5.51 5.51 0 0 0 2 12c0 3.02 2.47 5.5 5.5 5.5H9M8 12h8"/></svg>`;

/** Reicon — list3-filled. Text format modal breadcrumb: Lists half of Links and lists. */
export const ICON_LIST3_FILLED = "sf-list3-filled";
const LIST3_FILLED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M2 3.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5M7 4a1 1 0 0 0 0 2h15a1 1 0 1 0 0-2zm0 7a1 1 0 1 0 0 2h15a1 1 0 1 0 0-2zm-1 8a1 1 0 0 1 1-1h15a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1M.75 12a1.25 1.25 0 1 1 2.5 0a1.25 1.25 0 0 1-2.5 0M2 17.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5"/></svg>`;

/** Fluent UI — text-header-1-lines-24-regular. Text format modal breadcrumb: H1. */
export const ICON_TEXT_HEADER_1 = "sf-text-header-1";
const TEXT_HEADER_1_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M14.5 2.75a.75.75 0 0 0-1.42-.335c-.27.537-.683.957-1.049 1.25a4.6 4.6 0 0 1-.614.413l-.005.002a.75.75 0 0 0 .673 1.34h.002l.003-.001l.006-.003l.018-.01l.057-.03q.072-.04.19-.112a6 6 0 0 0 .607-.428L13 4.81v5.44a.75.75 0 0 0 1.5 0zM2.75 2a.75.75 0 0 1 .75.75V5.5h4V2.752a.75.75 0 0 1 1.5 0v7.492a.75.75 0 0 1-1.5 0V7h-4v3.25a.75.75 0 0 1-1.5 0v-7.5A.75.75 0 0 1 2.75 2m0 17a.75.75 0 0 0 0 1.5h18.5a.75.75 0 0 0 0-1.5zM2 14.75a.75.75 0 0 1 .75-.75h18.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75"/></svg>`;

/** Fluent UI — text-header-2-lines-24-regular. Text format modal breadcrumb: H2. */
export const ICON_TEXT_HEADER_2 = "sf-text-header-2";
const TEXT_HEADER_2_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M14.198 3.583c-.65-.254-1.462.11-1.767.768a.75.75 0 1 1-1.361-.63c.595-1.285 2.194-2.112 3.673-1.536c1.605.626 2.352 2.617 1.391 4.116c-.312.487-.739.903-1.157 1.264c-.243.21-.524.433-.788.643c-.167.133-.327.26-.467.376c-.396.326-.71.62-.926.91l-.005.006h3.46a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75c0-.65.254-1.197.59-1.65c.33-.443.762-.831 1.177-1.173c.19-.157.365-.297.536-.432c.235-.187.46-.365.694-.566c.38-.328.678-.632.874-.938c.415-.648.108-1.604-.674-1.908M3.5 2.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0V7h4v3.244a.75.75 0 0 0 1.5 0V2.752a.75.75 0 1 0-1.5 0V5.5h-4zm-1.5 17a.75.75 0 0 1 .75-.75h18.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75M2.75 14a.75.75 0 0 0 0 1.5h18.5a.75.75 0 0 0 0-1.5z"/></svg>`;

/** Fluent UI — text-header-3-lines-24-regular. Text format modal breadcrumb: H3. */
export const ICON_TEXT_HEADER_3 = "sf-text-header-3";
const TEXT_HEADER_3_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M3.5 2.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0V7h4v3.244a.75.75 0 0 0 1.5 0V2.752a.75.75 0 1 0-1.5 0V5.5h-4zm-1.5 17a.75.75 0 0 1 .75-.75h18.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75M2.75 14a.75.75 0 0 0 0 1.5h18.5a.75.75 0 0 0 0-1.5zM14.586 3.577c-.684-.206-1.72.015-2.292.616a.75.75 0 0 1-1.088-1.033c.983-1.034 2.616-1.38 3.813-1.019c.812.245 1.462.802 1.778 1.52c.324.734.276 1.6-.255 2.345q-.208.29-.453.496q.245.206.453.496c.53.746.579 1.611.255 2.345c-.316.718-.966 1.275-1.778 1.52c-1.197.362-2.83.015-3.813-1.019a.75.75 0 1 1 1.088-1.033c.572.601 1.608.823 2.291.616c.429-.13.715-.405.84-.688c.117-.266.11-.57-.105-.871c-.394-.552-1.06-.611-1.836-.616h-.129a.75.75 0 0 1 0-1.5h.129c.776-.005 1.442-.063 1.836-.616c.214-.301.222-.604.104-.87c-.124-.284-.41-.56-.838-.689"/></svg>`;

/** Fluent UI — text-header-4-lines-caret-24-regular. Text format modal breadcrumb: H4–6 group. */
export const ICON_TEXT_HEADER_4_CARET = "sf-text-header-4-caret";
const TEXT_HEADER_4_CARET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M21.249 19a.75.75 0 0 1 0 1.5h-18.5a.75.75 0 0 1 0-1.5zm0-5a.75.75 0 0 1 0 1.5h-18.5a.75.75 0 0 1 0-1.5zM2.749 2a.75.75 0 0 1 .75.75V5.5h4V2.751a.75.75 0 0 1 1.5 0v7.493a.75.75 0 1 1-1.5 0V7h-4v3.25a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m11.395.309a.75.75 0 0 1 1.356.441V7.5h.75a.75.75 0 0 1 0 1.5h-.75v1.25a.75.75 0 0 1-1.5 0V9h-3.25a.75.75 0 0 1-.606-1.191zm7.107 2.689a.752.752 0 0 1 .53 1.281l-1.5 1.501a.75.75 0 0 1-1.061 0l-1.501-1.5a.75.75 0 0 1 .53-1.282zM12.223 7.5H14V5.056z"/></svg>`;

/** Fluent UI — text-header-4-24-regular. Text format modal breadcrumb: H4. */
export const ICON_TEXT_HEADER_4 = "sf-text-header-4";
const TEXT_HEADER_4_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M10.75 5a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V12.5H3.5v5.75a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0V11H10V5.75a.75.75 0 0 1 .75-.75m8.55.291c.6-.611 1.704-.204 1.705.71V14.5h1.246a.75.75 0 0 1 0 1.5h-1.246v2.25a.751.751 0 0 1-1.5 0V16h-5.342a1.25 1.25 0 0 1-1.023-1.969l6.047-8.603zM14.644 14.5h4.86V7.583z"/></svg>`;

/** Fluent UI — text-header-5-24-regular. Text format modal breadcrumb: H5. */
export const ICON_TEXT_HEADER_5 = "sf-text-header-5";
const TEXT_HEADER_5_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M10.75 5a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V12.5H3.5v5.75a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0V11H10V5.75a.75.75 0 0 1 .75-.75m9.499-.001a.751.751 0 0 1 0 1.501h-4.571l-.35 3.487c.205-.002.433-.006.67-.007c.774-.003 1.727.005 2.162.066l.241.04a4.75 4.75 0 1 1-5.361 6.303a.75.75 0 0 1 1.407-.518a3.25 3.25 0 1 0 3.669-4.312l-.165-.028c-.303-.042-1.128-.054-1.947-.05c-.395.001-.767.006-1.041.01q-.224.006-.446.008a.752.752 0 0 1-.764-.824l.5-5A.75.75 0 0 1 15 5z"/></svg>`;

/** Fluent UI — text-header-6-24-regular. Text format modal breadcrumb: H6. */
export const ICON_TEXT_HEADER_6 = "sf-text-header-6";
const TEXT_HEADER_6_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M18 4.5c1.758 0 3.114.807 4.03 2.08l.177.26l.038.067a.75.75 0 0 1-1.256.807l-.045-.063l-.129-.19C20.153 6.536 19.228 6 18 6c-1.304 0-2.266.603-2.935 1.635c-.62.957-.987 2.296-1.053 3.85a5 5 0 1 1 3.707 8.007l-.07-.003c-1.729-.104-3.027-.981-3.878-2.312c-.884-1.384-1.271-3.23-1.271-5.177c0-1.955.412-3.8 1.307-5.18C14.72 5.407 16.134 4.5 18 4.5m-7.75.5a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V12.5H3v5.75a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0V11h6.5V5.75a.75.75 0 0 1 .75-.75M18 11a3.5 3.5 0 0 0-.182 6.994L18 18a3.5 3.5 0 1 0 0-7"/></svg>`;

/** Hugeicons — vertical-scroll-point. Text format modal breadcrumb: Extras. Distinct from ICON_SCROLL (Codex catalog). */
export const ICON_VERTICAL_SCROLL_POINT = "sf-vertical-scroll-point";
const VERTICAL_SCROLL_POINT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0M8 7s2.946-4 4-4s4 4 4 4m0 10s-2.946 4-4 4s-4-4-4-4"/></svg>`;

export function registerCustomIcons(): void {
	addIcon(ICON_PAGE_TEXT, PAGE_TEXT_SVG);
	addIcon(ICON_PAGE_PORTRAIT, PAGE_PORTRAIT_SVG);
	addIcon(ICON_BLOCKQUOTE, BLOCKQUOTE_SVG);
	addIcon(ICON_LINK2, LINK2_SVG);
	addIcon(ICON_LIST3_FILLED, LIST3_FILLED_SVG);
	addIcon(ICON_TEXT_HEADER_1, TEXT_HEADER_1_SVG);
	addIcon(ICON_TEXT_HEADER_2, TEXT_HEADER_2_SVG);
	addIcon(ICON_TEXT_HEADER_3, TEXT_HEADER_3_SVG);
	addIcon(ICON_TEXT_HEADER_4_CARET, TEXT_HEADER_4_CARET_SVG);
	addIcon(ICON_TEXT_HEADER_4, TEXT_HEADER_4_SVG);
	addIcon(ICON_TEXT_HEADER_5, TEXT_HEADER_5_SVG);
	addIcon(ICON_TEXT_HEADER_6, TEXT_HEADER_6_SVG);
	addIcon(ICON_VERTICAL_SCROLL_POINT, VERTICAL_SCROLL_POINT_SVG);
}
