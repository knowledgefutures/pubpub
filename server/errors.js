export class HTTPStatusError extends Error {
	constructor(status, sourceError) {
		super(`HTTP Error ${status}${sourceError ? ': ' + sourceError.message : ''}`);
		this.status = status;
	}

	inRange(codeRange) {
		return this.status >= codeRange && this.status <= codeRange + 99;
	}
}

export class ForbiddenError extends HTTPStatusError {
	constructor(sourceError) {
		super(403, sourceError);
	}
}

export class NotFoundError extends HTTPStatusError {
	constructor(sourceError) {
		super(404, sourceError);
	}
}
