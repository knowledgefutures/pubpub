import type { UserWithPrivateFields } from './user';

export {};

declare global {
	namespace Express {
		export interface Request {
			user?: UserWithPrivateFields;
		}
	}
}

declare module '*.scss' {
	const content: string;
}
