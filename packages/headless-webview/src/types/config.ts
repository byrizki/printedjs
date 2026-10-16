export interface HeadlessWebViewConfig {
	url?: string;
	html?: string;
	userAgent?: string;
	devtools?: boolean;
	transparent?: boolean;
	initializationScripts?: string[];
}
