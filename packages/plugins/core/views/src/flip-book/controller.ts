import { PageFlipController } from "@printedjs/plugin-page-flip";
import type { FlipBookController, FlipBookViewOptions } from "../types.js";

export class DomFlipBookController
	extends PageFlipController
	implements FlipBookController
{
	constructor(container: HTMLElement, options: FlipBookViewOptions = {}) {
		super(container, {
			sound: options.sound,
			turnDurationMs: options.turnDurationMs,
			keyboardNavigation: options.keyboardNavigation,
		});
	}
}
