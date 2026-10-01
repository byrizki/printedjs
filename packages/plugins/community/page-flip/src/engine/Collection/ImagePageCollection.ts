import { ImagePage } from "../Page/ImagePage.js";
import type { Render } from "../Render/Render.js";
import { PageCollection } from "./PageCollection.js";
import type { PageFlip } from "../PageFlip.js";
import { PageDensity } from "../Page/Page.js";

/**
 * Class representing a collection of pages as images on the canvas
 */
export class ImagePageCollection extends PageCollection {
	private readonly imagesHref: string[];

	constructor(app: PageFlip, render: Render, imagesHref: string[]) {
		super(app, render);

		this.imagesHref = imagesHref;
	}

	public load(): void {
		for (const href of this.imagesHref) {
			const page = new ImagePage(this.render, href, PageDensity.SOFT);

			page.load();
			this.pages.push(page);
		}

		this.createSpread();
	}
}
