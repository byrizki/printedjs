import { standardPreset } from "./standard.js";

export { standardPreset };

interface WindowWithPrintedjsPlugins {
	PrintedjsPreset?: unknown;
	PrintedjsPlugins?: unknown;
}

if (typeof window !== "undefined") {
	// SAFETY: Window object augmented with plugin preset exports
	const win = window as Window & WindowWithPrintedjsPlugins;
	win.PrintedjsPreset = { standardPreset };
	win.PrintedjsPlugins = { standardPreset };
}
