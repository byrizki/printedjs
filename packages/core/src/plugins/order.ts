import { PrintedjsPluginOrderError } from "../contracts/errors.js";
import type { PrintedjsPlugin } from "../contracts/plugin.js";

export function orderPlugins(plugins: readonly PrintedjsPlugin[]): PrintedjsPlugin[] {
	const nameMap = new Map<string, { plugin: PrintedjsPlugin; index: number }>();

	for (let i = 0; i < plugins.length; i++) {
		const plugin = plugins[i]!;
		if (nameMap.has(plugin.name)) {
			throw new PrintedjsPluginOrderError(
				`Duplicate plugin name detected: "${plugin.name}"`,
			);
		}
		nameMap.set(plugin.name, { plugin, index: i });
	}

	// adjacency list: u -> Set of nodes that must come after u
	const adj = new Map<string, Set<string>>();
	const inDegree = new Map<string, number>();

	for (const plugin of plugins) {
		adj.set(plugin.name, new Set());
		inDegree.set(plugin.name, 0);
	}

	for (const plugin of plugins) {
		if (plugin.after) {
			for (const dep of plugin.after) {
				if (!nameMap.has(dep)) {
					throw new PrintedjsPluginOrderError(
						`Plugin "${plugin.name}" specifies unknown dependency in "after": "${dep}"`,
					);
				}
				// dep must come before plugin: dep -> plugin
				const set = adj.get(dep)!;
				if (!set.has(plugin.name)) {
					set.add(plugin.name);
					inDegree.set(plugin.name, (inDegree.get(plugin.name) ?? 0) + 1);
				}
			}
		}

		if (plugin.before) {
			for (const target of plugin.before) {
				if (!nameMap.has(target)) {
					throw new PrintedjsPluginOrderError(
						`Plugin "${plugin.name}" specifies unknown dependency in "before": "${target}"`,
					);
				}
				// plugin must come before target: plugin -> target
				const set = adj.get(plugin.name)!;
				if (!set.has(target)) {
					set.add(target);
					inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
				}
			}
		}
	}

	// Stable Kahn's algorithm:
	// Prioritize nodes by their original appearance index when in-degree becomes 0
	const ready: string[] = [];
	for (const plugin of plugins) {
		if (inDegree.get(plugin.name) === 0) {
			ready.push(plugin.name);
		}
	}

	const ordered: PrintedjsPlugin[] = [];

	while (ready.length > 0) {
		// Pick the element with the lowest original index among ready elements for stable sorting
		ready.sort((a, b) => (nameMap.get(a)?.index ?? 0) - (nameMap.get(b)?.index ?? 0));
		const curr = ready.shift()!;
		ordered.push(nameMap.get(curr)!.plugin);

		for (const neighbor of adj.get(curr)!) {
			const deg = (inDegree.get(neighbor) ?? 1) - 1;
			inDegree.set(neighbor, deg);
			if (deg === 0) {
				ready.push(neighbor);
			}
		}
	}

	if (ordered.length !== plugins.length) {
		throw new PrintedjsPluginOrderError("Circular dependency detected among plugins");
	}

	return ordered;
}
