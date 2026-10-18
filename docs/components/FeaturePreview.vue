<script setup lang="ts">
import { ref, computed } from "vue";
import {
	FEATURE_TEMPLATES,
	type FeatureKey,
	type FeatureTemplate,
} from "./feature-templates";

const props = withDefaults(
	defineProps<{
		feature: string;
		height?: string;
		title?: string;
	}>(),
	{
		height: "500px",
		title: "",
	},
);

const activeTab = ref<"preview" | "code">("preview");

const isFullscreen = ref(false);

const iframeRef = ref<HTMLIFrameElement | null>(null);

const scriptUrl = computed(() => {
	if (typeof window !== "undefined") {
		return window.location.pathname.startsWith("/printedjs")
			? "/printedjs/printedjs.min.js"
			: "/printedjs.min.js";
	}

	return "/printedjs/printedjs.min.js";
});

const flipbookScriptUrl = computed(() => {
	if (typeof window !== "undefined") {
		return window.location.pathname.startsWith("/printedjs")
			? "/printedjs/printedjs-page-flip.min.js"
			: "/printedjs-page-flip.min.js";
	}

	return "/printedjs/printedjs-page-flip.min.js";
});

function isFeatureKey(key: string): key is FeatureKey {
	return Object.prototype.hasOwnProperty.call(FEATURE_TEMPLATES, key);
}

const currentTemplate = computed<FeatureTemplate>(() => {
	const key = isFeatureKey(props.feature) ? props.feature : "summary";

	return FEATURE_TEMPLATES[key];
});

const displayTitle = computed(() => {
	if (props.title) {
		return props.title;
	}

	return currentTemplate.value.title;
});

const iframeSrcdoc = computed(() => {
	const tpl = currentTemplate.value;
	const closingScript = "</" + "script>";

	const isFlipbook =
		props.feature.includes("flipbook") || props.feature === "reader-views";

	const flipbookTag = isFlipbook
		? `<script src="${flipbookScriptUrl.value}">${closingScript}`
		: "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    html, body {
      background-color: #f1f5f9;
      margin: 0;
      padding: 12px;
      min-height: 100%;
      box-sizing: border-box;
    }
    ${tpl.css}
  </style>
  <script src="${scriptUrl.value}">${closingScript}
  ${flipbookTag}
</head>
<body>
  ${tpl.html}
</body>
</html>`;
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
		<!-- Toolbar Header -->
		<div
			class="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-slate-200"
		>
			<div class="flex items-center gap-3">
				<span
					class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30"
				>
					Live Feature Demo
				</span>
				<span class="text-xs font-medium text-slate-300 hidden sm:inline">
					{{ displayTitle }}
				</span>
			</div>

			<div class="flex items-center gap-2">
				<!-- Tab Switcher -->
				<div
					class="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs"
				>
					<button
						type="button"
						@click="activeTab = 'preview'"
						class="px-2.5 py-1 rounded-md transition-colors"
						:class="
							activeTab === 'preview'
								? 'bg-sky-600 text-white font-medium shadow-sm'
								: 'text-slate-400 hover:text-slate-200'
						"
					>
						Live Preview
					</button>
					<button
						type="button"
						@click="activeTab = 'code'"
						class="px-2.5 py-1 rounded-md transition-colors"
						:class="
							activeTab === 'code'
								? 'bg-sky-600 text-white font-medium shadow-sm'
								: 'text-slate-400 hover:text-slate-200'
						"
					>
						HTML / CSS
					</button>
				</div>

				<!-- Reload Button -->
				<button
					type="button"
					@click="reloadIframe"
					class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
					title="Rerun pagination"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
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
				</button>

				<!-- Fullscreen Button -->
				<button
					type="button"
					@click="toggleFullscreen"
					class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
					:title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
				>
					<svg
						v-if="!isFullscreen"
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="15 3 21 3 21 9" />
						<polyline points="9 21 3 21 3 15" />
						<line x1="21" y1="3" x2="14" y2="10" />
						<line x1="3" y1="21" x2="10" y2="14" />
					</svg>
					<svg
						v-else
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="4 14 10 14 10 20" />
						<polyline points="20 10 14 10 14 4" />
						<line x1="14" y1="10" x2="21" y2="3" />
						<line x1="3" y1="21" x2="10" y2="14" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Main Preview Area -->
		<div v-show="activeTab === 'preview'" class="relative bg-slate-100">
			<iframe
				ref="iframeRef"
				:srcdoc="iframeSrcdoc"
				class="w-full border-none block"
				:style="{ height: isFullscreen ? 'calc(100vh - 45px)' : props.height }"
				title="Printedjs Feature Live Preview"
				loading="lazy"
			></iframe>
		</div>

		<!-- Code Inspection Tab -->
		<div
			v-show="activeTab === 'code'"
			class="p-4 bg-slate-950 text-slate-200 overflow-y-auto font-mono text-xs space-y-4"
			:style="{ height: isFullscreen ? 'calc(100vh - 45px)' : props.height }"
		>
			<div>
				<div class="text-xs uppercase font-semibold text-sky-400 mb-1">
					CSS Paged Media Rules
				</div>
				<pre
					class="bg-slate-900 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto"
				><code>{{ currentTemplate.css }}</code></pre>
			</div>

			<div>
				<div class="text-xs uppercase font-semibold text-sky-400 mb-1">
					Document HTML Structure
				</div>
				<pre
					class="bg-slate-900 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto"
				><code>{{ currentTemplate.html }}</code></pre>
			</div>
		</div>
	</div>
</template>
