<script setup lang="ts">
const badges = [
	{
		alt: "npm core",
		src: "https://img.shields.io/npm/v/@printedjs/core.svg?color=cb3837&label=core&logo=npm",
		href: "https://www.npmjs.com/package/@printedjs/core",
	},
	{
		alt: "npm browser",
		src: "https://img.shields.io/npm/v/@printedjs/browser.svg?color=cb3837&label=browser&logo=npm",
		href: "https://www.npmjs.com/package/@printedjs/browser",
	},
	{
		alt: "npm minimal",
		src: "https://img.shields.io/npm/v/@printedjs/minimal.svg?color=cb3837&label=minimal&logo=npm",
		href: "https://www.npmjs.com/package/@printedjs/minimal",
	},
	{
		alt: "npm cli",
		src: "https://img.shields.io/npm/v/@printedjs/cli.svg?color=cb3837&label=cli&logo=npm",
		href: "https://www.npmjs.com/package/@printedjs/cli",
	},
	{
		alt: "NuGet HeadlessWebView",
		src: "https://img.shields.io/nuget/v/PrintedJs.HeadlessWebView.svg?color=004880&label=nuget&logo=nuget",
		href: "https://www.nuget.org/packages/PrintedJs.HeadlessWebView",
	},
	{
		alt: "CI",
		src: "https://img.shields.io/github/actions/workflow/status/byrizki/printedjs/ci.yml?branch=main&label=CI&logo=github",
		href: "https://github.com/byrizki/printedjs/actions/workflows/ci.yml",
	},
	{
		alt: "License MIT",
		src: "https://img.shields.io/badge/license-MIT-blue.svg",
		href: "https://github.com/byrizki/printedjs/blob/main/LICENSE",
	},
];
</script>

<template>
	<div class="flex flex-wrap items-center gap-2.5 my-4">
		<a
			v-for="badge in badges"
			:key="badge.alt"
			:href="badge.href"
			target="_blank"
			rel="noopener noreferrer"
			class="hover:opacity-80 transition-opacity inline-flex items-center"
		>
			<img :src="badge.src" :alt="badge.alt" class="h-[22px] w-auto" />
		</a>
	</div>
</template>
