export class PrintedjsError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = new.target.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class PrintedjsInputError extends PrintedjsError {}

export class PrintedjsStylesheetError extends PrintedjsError {}

export class PrintedjsAbortError extends PrintedjsError {}

export class PrintedjsPluginError extends PrintedjsError {
	readonly pluginName: string;

	constructor(message: string, pluginName: string, options?: ErrorOptions) {
		super(message, options);
		this.pluginName = pluginName;
	}
}

export class PrintedjsPluginOrderError extends PrintedjsError {}

export class PrintedjsLayoutLimitError extends PrintedjsError {}
