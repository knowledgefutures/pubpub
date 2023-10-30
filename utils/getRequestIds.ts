import { Request } from 'express';
import { User } from 'server/models';

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

export function oldCreateGetRequestIds<ExpectedBody extends Record<string, any>>() {
	return function <ReqBody extends ExpectedBody, A, B, C, D extends Record<string, any>>(
		req: Request<A, B, ReqBody, C, D>,
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
	return function <PassedBody extends ExpectedBody>(body: PassedBody, user?: User) {
		const picked: Partial<ExpectedBody> = { ...body };

		return {
			...picked,
			userId: user?.id,
		} as unknown as WithUserId<Helper<ExpectedBody, PassedBody>>;
	};
}
