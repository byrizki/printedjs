import type { PageFlip } from "../PageFlip.js";

/**
 * Data type passed to the event handler
 */
export type DataType = number | string | boolean | object | null;

/**
 * Type of object in event handlers
 */
export interface WidgetEvent {
	data: DataType;
	object: PageFlip;
}

type EventCallback = (e: WidgetEvent) => void;

/**
 * A class implementing a basic event model
 */
export abstract class EventObject {
	private readonly events = new Map<string, EventCallback[]>();

	public on(eventName: string, callback: EventCallback): EventObject {
		const existing = this.events.get(eventName);
		if (!existing) {
			this.events.set(eventName, [callback]);
		} else {
			existing.push(callback);
		}

		return this;
	}

	public off(event: string): void {
		this.events.delete(event);
	}

	protected trigger(eventName: string, app: PageFlip, data: DataType = null): void {
		const list = this.events.get(eventName);
		if (!list) return;

		for (const callback of list) {
			callback({ data, object: app });
		}
	}
}
