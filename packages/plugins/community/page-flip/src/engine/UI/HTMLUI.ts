import { UI } from "./UI.js";
import type { PageFlip } from "../PageFlip.js";
import type { FlipSetting } from "../Settings.js";

/**
 * UI for HTML mode
 */
export class HTMLUI extends UI {
	private items: NodeListOf<HTMLElement> | HTMLElement[];

	constructor(
		inBlock: HTMLElement,
		app: PageFlip,
		setting: FlipSetting,
		items: NodeListOf<HTMLElement> | HTMLElement[],
	) {
		super(inBlock, app, setting);

		this.wrapper.insertAdjacentHTML("afterbegin", '<div class="stf__block"></div>');
		this.distElement =
			(inBlock.querySelector(".stf__block") as HTMLElement) ?? this.wrapper;

		this.items = items;
		for (const item of Array.from(items)) {
			this.distElement.appendChild(item);
		}

		this.setHandlers();
	}

	public clear(): void {
		for (const item of Array.from(this.items)) {
			item.style.position = "";
			item.style.display = "";
			item.style.width = "";
			item.style.height = "";
			item.style.left = "";
			item.style.top = "";
			item.style.zIndex = "";
			item.style.transform = "";
			item.style.clipPath = "";
			item.style.removeProperty("-webkit-clip-path");
			item.style.removeProperty("-webkit-transform");
			item.style.removeProperty("-webkit-backface-visibility");
			item.classList.remove(
				"stf__item",
				"--simple",
				"--left",
				"--right",
				"--hard",
				"--soft",
			);
			if (item.parentElement !== this.parentElement) {
				this.parentElement.appendChild(item);
			}
		}
	}

	public override destroy(): void {
		this.clear();
		super.destroy();
	}

	public updateItems(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
		this.removeHandlers();

		this.distElement.innerHTML = "";

		for (const item of Array.from(items)) {
			this.distElement.appendChild(item);
		}
		this.items = items;

		this.setHandlers();
	}

	public update(): void {
		this.app.getRender().update();
	}
}
