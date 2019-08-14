export class HTTPStatusError extends Error {
	constructor(status, sourceError) {
		super(`HTTP Error ${status}${sourceError ? ': ' + sourceError.message : ''}`);
		this.status = status;
	}
}

export class ForbiddenError extends HTTPStatusError {
	constructor(sourceError) {
		super(403, sourceError);
	}
}
