<script setup lang="ts">
import { ref, computed } from "vue";

const props = withDefaults(
	defineProps<{
		initialHeight?: string;
	}>(),
	{
		initialHeight: "820px",
	},
);

const iframeRef = ref<HTMLIFrameElement | null>(null);

const isFullscreen = ref(false);

const demoUrl = computed(() => {
	if (typeof window !== "undefined") {
		const base = window.location.pathname.startsWith("/printedjs") ? "/printedjs/" : "/";

		return `${base}demo/`;
	}

	return "/printedjs/demo/";
});

function reloadIframe() {
	if (iframeRef.value?.contentWindow) {
		iframeRef.value.contentWindow.location.reload();
	}
}

function toggleFullscreen() {
	isFullscreen.value = !isFullscreen.value;
}
</script>

<template>
	<div
		class="my-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg bg-slate-900 transition-all duration-300"
		:class="{ 'fixed inset-0 z-50 rounded-none m-0': isFullscreen }"
	>
		<!-- Demo Header Bar -->
		<div
			class="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-slate-200"
		>
			<div class="flex items-center gap-2.5">
				<span
					class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
				>
					Enterprise Demo
				</span>
				<span class="text-sm font-medium text-slate-300 hidden sm:inline"
					>Printedjs Minimal Full Page Specification</span
				>
			</div>
			<div class="flex items-center gap-2 text-xs">
				<button
					type="button"
					@click="reloadIframe"
					class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
					title="Reload Demo"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
						<path d="M21 3v5h-5" />
						<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
						<path d="M8 16H3v5" />
					</svg>
					<span>Reload</span>
				</button>
				<button
					type="button"
					@click="toggleFullscreen"
					class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
				>
					<span v-if="!isFullscreen">Fullscreen</span>
					<span v-else>Exit Fullscreen</span>
				</button>
			</div>
		</div>

		<!-- Minimal Demo Iframe -->
		<iframe
			ref="iframeRef"
			:src="demoUrl"
			class="w-full border-none block bg-slate-100"
			:style="{ height: isFullscreen ? 'calc(100vh - 49px)' : props.initialHeight }"
			title="Printedjs Minimal Full Page Demo"
			loading="lazy"
		></iframe>
	</div>
</template>
