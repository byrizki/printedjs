export interface PagedjsCompatibilityOptions {
	/**
	 * When true, enables backwards compatibility with legacy Paged.js
	 * by adding pagedjs_* class aliases and --pagedjs-* CSS variable aliases
	 * alongside the primary printedjs_* classes and --printedjs-* variables.
	 * When false (default), emits pure printedjs naming only.
	 */
	readonly pagedjsCompatible?: boolean | undefined;
}
