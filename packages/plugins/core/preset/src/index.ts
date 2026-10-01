import { standardPreset } from "./standard.js";

export { standardPreset };

if (typeof window !== "undefined") {
	const win = window as unknown as Record<string, unknown>;
	win.PrintedjsPreset = { standardPreset };
	win.PrintedjsPlugins = { standardPreset };
}
