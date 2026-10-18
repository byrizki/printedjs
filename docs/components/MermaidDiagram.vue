<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import mermaid from "mermaid";

const props = defineProps<{
	code: string;
}>();

const renderedSvg = ref<string>("");

const renderError = ref<string | null>(null);

const showSource = ref<boolean>(false);

const zoom = ref<number>(1);

const isFitWidth = ref<boolean>(false);

const isFullscreen = ref<boolean>(false);

const containerRef = ref<HTMLElement | null>(null);

const isDragging = ref<boolean>(false);

const dragStartX = ref<number>(0);

const dragStartY = ref<number>(0);

const dragScrollLeft = ref<number>(0);

const dragScrollTop = ref<number>(0);

function zoomIn() {
	isFitWidth.value = false;
	zoom.value = Math.min(3, +(zoom.value + 0.2).toFixed(2));
}

function zoomOut() {
	isFitWidth.value = false;
	zoom.value = Math.max(0.4, +(zoom.value - 0.2).toFixed(2));
}

function resetZoom() {
	zoom.value = 1;
	isFitWidth.value = false;
}

function toggleFitWidth() {
	isFitWidth.value = !isFitWidth.value;

	if (isFitWidth.value) {
		zoom.value = 1;
	}
}

function toggleFullscreen() {
	isFullscreen.value = !isFullscreen.value;
}

function onMouseDown(e: MouseEvent) {
	if (!containerRef.value || e.button !== 0) {
		return;
	}

	isDragging.value = true;
	dragStartX.value = e.clientX;
	dragStartY.value = e.clientY;
	dragScrollLeft.value = containerRef.value.scrollLeft;
	dragScrollTop.value = containerRef.value.scrollTop;
}

function onMouseMove(e: MouseEvent) {
	if (!isDragging.value || !containerRef.value) {
		return;
	}

	e.preventDefault();

	const dx = e.clientX - dragStartX.value;
	const dy = e.clientY - dragStartY.value;

	containerRef.value.scrollLeft = dragScrollLeft.value - dx;
	containerRef.value.scrollTop = dragScrollTop.value - dy;
}

function onMouseUp() {
	isDragging.value = false;
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === "Escape" && isFullscreen.value) {
		isFullscreen.value = false;
	}
}

async function renderDiagram() {
	if (!props.code || typeof window === "undefined") {
		return;
	}

	renderError.value = null;

	const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

	try {
		const isDark = document.documentElement.classList.contains("dark");

		mermaid.initialize({
			startOnLoad: false,
			theme: isDark ? "dark" : "neutral",
			securityLevel: "loose",
			fontFamily: "Inter, system-ui, sans-serif",
			flowchart: {
				useMaxWidth: true,
				htmlLabels: true,
				curve: "basis",
			},
		});

		const cleanCode = props.code.trim();
		const { svg } = await mermaid.render(uniqueId, cleanCode);

		renderedSvg.value = svg;
	} catch (err: unknown) {
		renderError.value = err instanceof Error ? err.message : String(err);

		const stray =
			document.getElementById(uniqueId) || document.getElementById(`d${uniqueId}`);

		stray?.remove();
	}
}

let observer: MutationObserver | null = null;

onMounted(() => {
	renderDiagram();

	observer = new MutationObserver(() => {
		renderDiagram();
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	window.addEventListener("keydown", onKeydown);
	window.addEventListener("mouseup", onMouseUp);
});

onUnmounted(() => {
	observer?.disconnect();
	window.removeEventListener("keydown", onKeydown);
	window.removeEventListener("mouseup", onMouseUp);
});

watch(
	() => props.code,
	() => {
		renderDiagram();
	},
);
</script>

<template>
	<div
		class="my-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900 transition-colors"
		:class="{
			'fixed inset-0 z-50 rounded-none m-0 flex flex-col bg-slate-900/98 backdrop-blur-md':
				isFullscreen,
		}"
	>
		<!-- Diagram Toolbar -->
		<div
			class="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
		>
			<div class="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
				<span class="inline-block w-2 h-2 rounded-full bg-sky-500"></span>
				<span class="font-semibold text-slate-700 dark:text-slate-300">Diagram</span>
				<span v-if="!isFitWidth" class="text-[10px] text-slate-400 hidden sm:inline">
					(Scroll or drag to pan)
				</span>
			</div>

			<!-- Interactive Controls -->
			<div class="flex items-center gap-1.5 sm:gap-2">
				<!-- Zoom Controls -->
				<div
					class="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
				>
					<button
						type="button"
						title="Zoom Out"
						aria-label="Zoom Out"
						@click="zoomOut"
						class="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-bold"
					>
						−
					</button>

					<button
						type="button"
						title="Reset Zoom"
						aria-label="Reset Zoom"
						@click="resetZoom"
						class="px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-x border-slate-200 dark:border-slate-800 transition-colors"
					>
						{{ Math.round(zoom * 100) }}%
					</button>

					<button
						type="button"
						title="Zoom In"
						aria-label="Zoom In"
						@click="zoomIn"
						class="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-bold"
					>
						+
					</button>
				</div>

				<!-- Fit Width Toggle -->
				<button
					type="button"
					@click="toggleFitWidth"
					title="Toggle Fit Width"
					class="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-800 transition-colors"
					:class="
						isFitWidth
							? 'bg-sky-600 text-white font-medium border-sky-600 shadow-xs'
							: 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
					"
				>
					{{ isFitWidth ? "Fit" : "100%" }}
				</button>

				<!-- Fullscreen Toggle -->
				<button
					type="button"
					@click="toggleFullscreen"
					:title="isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'"
					aria-label="Toggle Fullscreen"
					class="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
				>
					<span v-if="!isFullscreen">⛶</span>
					<span v-else>✕ Close</span>
				</button>

				<!-- View Syntax Toggle -->
				<button
					type="button"
					@click="showSource = !showSource"
					class="px-2.5 py-1 rounded-lg text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
				>
					{{ showSource ? "Hide Syntax" : "View Syntax" }}
				</button>
			</div>
		</div>

		<!-- Diagram Content Area -->
		<div
			v-if="!renderError"
			ref="containerRef"
			@mousedown="onMouseDown"
			@mousemove="onMouseMove"
			class="p-6 overflow-auto flex justify-center items-start transition-all select-none min-h-[260px] max-h-[640px]"
			:class="{
				'cursor-grab': !isDragging,
				'cursor-grabbing': isDragging,
				'flex-1 h-full max-h-none min-h-[500px]': isFullscreen,
			}"
		>
			<div
				class="transition-transform duration-150 origin-top flex justify-center w-full py-2"
				:style="{
					transform: `scale(${zoom})`,
					transformOrigin: 'top center',
				}"
				:class="{
					'[&_svg]:w-full [&_svg]:max-w-full [&_svg]:h-auto': isFitWidth,
					'[&_svg]:max-w-full [&_svg]:h-auto': !isFitWidth,
				}"
				v-html="renderedSvg"
			></div>
		</div>

		<!-- Error Display -->
		<div v-else class="p-4 text-xs font-mono text-red-500 bg-red-500/10">
			<p class="font-bold mb-1">Diagram rendering error:</p>
			<pre>{{ renderError }}</pre>
		</div>

		<!-- Syntax Code View -->
		<div
			v-show="showSource"
			class="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto"
		>
			<pre><code>{{ props.code }}</code></pre>
		</div>
	</div>
</template>
