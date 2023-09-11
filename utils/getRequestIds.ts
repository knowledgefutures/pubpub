import { Request } from 'express';
import { User } from 'server/models';

// type PickOrUndefined<T, K extends keyof T> = {
// 	[P in K]: unknown extends T[P] ? undefined : T[P];
// };

// type UndefinedKeys<T> = {
// 	[K in keyof T]: undefined;
// };

// type DefinedKeys<T> = {
// 	[K in keyof T]: {} extends Pick<T, K> ? never : K;
// }[keyof T];

type WithUserId<T> = T & { userId?: string };

type Helper<
	ExpectedBody extends Record<string, any>,
	ReqBody extends ExpectedBody,
	C extends ExpectedBody & ReqBody = ExpectedBody & ReqBody,
> = {
	[K in keyof C]: K extends keyof ReqBody
		? ReqBody[K] extends C[K]
			? C[K]
			: undefined
		: undefined;
};
// {
// 	[EK in keyof ExpectedBody]: ReqBody[EK];
// };

export function oldCreateGetRequestIds<ExpectedBody extends Record<string, any>>() {
	return function <ReqBody extends ExpectedBody, A, B, C, D extends Record<string, any>>(
		req: Request<A, B, ReqBody, C, D>, // : WithUserId<Pick<ReqBody, DefinedKeys<ReqBody>>>
	) {
		const user = req.user || {};
		const picked: Partial<ExpectedBody> = { ...req.body };

		return {
			...picked,
			userId: user.id,
		} as unknown as WithUserId<Helper<ExpectedBody, ReqBody>>;
	};
}

export function createGetRequestIds<ExpectedBody extends Record<string, any>>() {
	return function <PassedBody extends ExpectedBody>(
		body: PassedBody, // : WithUserId<Pick<ReqBody, DefinedKeys<ReqBody>>>
		user?: User,
	) {
		const picked: Partial<ExpectedBody> = { ...body };

		return {
			...picked,
			userId: user?.id,
		} as unknown as WithUserId<Helper<ExpectedBody, PassedBody>>;
	};
}
