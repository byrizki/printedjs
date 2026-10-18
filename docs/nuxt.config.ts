export default defineNuxtConfig({
	modules: ["@nuxtjs/i18n"],
	app: {
		head: {
			link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
		},
		baseURL: "/printedjs/",
	},
	i18n: {
		defaultLocale: "en",
		locales: [
			{
				code: "en",
				name: "English",
			},
			{
				code: "id",
				name: "Indonesia",
			},
		],
	},
	content: {
		build: {
			markdown: {
				highlight: {
					theme: {
						default: "github-light",
						dark: "github-dark",
						sepia: "monokai",
					},
					langs: [
						"js",
						"ts",
						"jsx",
						"tsx",
						"json",
						"bash",
						"sh",
						"toml",
						"csharp",
						"rust",
						"html",
						"css",
					],
				},
			},
		},
	},
	hooks: {
		"components:extend"(components) {
			for (const comp of components) {
				comp.global = true;
			}
		},
	},
	vite: {
		build: {
			rollupOptions: {
				external: ["@tiptap/y-tiptap"],
			},
			// @ts-expect-error Rolldown bundler option in Vite
			rolldownOptions: {
				external: ["@tiptap/y-tiptap"],
			},
		},
	},
});
