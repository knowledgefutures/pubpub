import { UserWithPrivateFields } from './user';

export {};

declare global {
	namespace Express {
		export interface Request {
			user?: UserWithPrivateFields;
		}
	}
}
