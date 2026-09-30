import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/editor/editor.worker?worker";
import cssWorker from "monaco-editor/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/language/json/json.worker?worker";
import tsWorker from "monaco-editor/language/typescript/ts.worker?worker";

interface WindowWithMonaco extends Window {
	MonacoEnvironment?: {
		getWorker(_: unknown, label: string): Worker;
	};
}

(window as unknown as WindowWithMonaco).MonacoEnvironment = {
	getWorker(_: unknown, label: string): Worker {
		if (label === "json") {
			return new jsonWorker();
		}
		if (label === "css" || label === "scss" || label === "less") {
			return new cssWorker();
		}
		if (label === "html" || label === "handlebars" || label === "razor") {
			return new htmlWorker();
		}
		if (label === "typescript" || label === "javascript") {
			return new tsWorker();
		}
		return new editorWorker();
	},
};

// Configure JSON schema diagnostics and linting
monaco.json.jsonDefaults.setDiagnosticsOptions({
	validate: true,
	allowComments: false,
	schemas: [],
	enableSchemaRequest: false,
});

// Configure HTML formatting and suggestions
monaco.html.htmlDefaults.setOptions({
	format: {
		tabSize: 2,
		insertSpaces: false,
		wrapLineLength: 120,
		unformatted: "wbr",
		contentUnformatted: "pre,code,textarea",
		indentInnerHtml: true,
		preserveNewLines: true,
		maxPreserveNewLines: 2,
		indentHandlebars: false,
		endWithNewline: false,
		extraLiners: "head, body, /html",
		wrapAttributes: "auto",
	},
	suggest: {
		html5: true,
	},
});

export function setMonacoTheme(theme: "light" | "dark"): void {
	monaco.editor.setTheme(theme === "light" ? "vs" : "vs-dark");
}

export { monaco };
