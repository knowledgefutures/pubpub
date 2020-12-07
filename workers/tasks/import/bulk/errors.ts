export class BulkImportError extends Error {
	constructor(errorContext, message) {
		super(message);
	}
}
