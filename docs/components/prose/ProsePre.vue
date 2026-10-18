<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";

const props = withDefaults(
	defineProps<{
		code?: string;
		language?: string | null;
		filename?: string | null;
		highlights?: number[];
		meta?: string | null;
		class?: string | null;
	}>(),
	{
		code: "",
		language: null,
		filename: null,
		highlights: () => [],
		meta: null,
		class: null,
	},
);

const isMermaid = computed(() => {
	return props.language === "mermaid";
});

const baseRef = useTemplateRef<HTMLElement>("baseRef");

const copied = ref(false);

async function copyCode() {
	const text = props.code || baseRef.value?.textContent || "";

	if (!text || typeof navigator === "undefined" || !navigator.clipboard) {
		return;
	}

	try {
		await navigator.clipboard.writeText(text);
		copied.value = true;
		setTimeout(() => {
			copied.value = false;
		}, 2000);
	} catch {
		// Ignore copy errors silently
	}
}
</script>

<template>
	<ClientOnly v-if="isMermaid">
		<MermaidDiagram :code="props.code" />
		<template #fallback>
			<div
				class="my-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-400 text-xs text-center animate-pulse"
			>
				Rendering Mermaid diagram...
			</div>
		</template>
	</ClientOnly>
	<div
		v-else
		class="relative my-5 group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors"
	>
		<div
			v-if="props.filename"
			class="flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-mono text-slate-600 dark:text-slate-400"
		>
			{{ props.filename }}
		</div>
		<button
			type="button"
			aria-label="Copy code to clipboard"
			@click="copyCode"
			class="absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded text-xs bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
		>
			{{ copied ? "Copied!" : "Copy" }}
		</button>
		<pre
			ref="baseRef"
			:class="[
				props.class,
				'p-4 overflow-x-auto text-sm leading-6 font-mono text-slate-800 dark:text-slate-200',
			]"
		><slot /></pre>
	</div>
</template>
