import jwt from 'jsonwebtoken';

const dashboardNums = {
	community: {
		type: 'community',
		base: { id: 2 },
		new: { id: 28 },
		benchmark: { id: 8 },
	},
	collection: {
		type: 'collection',
		base: { id: 7 },
		new: {
			id: 32,
			options: {
				event: 'collection',
			},
		},
	},
	pub: {
		base: { id: 3 },
		new: { id: 30 },
		benchmark: { id: 9 },
		type: 'pub',
	},
	pubpub: {
		base: { id: 6 },
		benchmark: { id: 10 },
		type: 'pubpub',
	},
} as const;

type DashboardNums = typeof dashboardNums;

export const generateMetabaseToken = <T extends keyof DashboardNums>(
	scopeType: T,
	scopeId: string | null,
	dashboardType: T extends T ? keyof DashboardNums[T] : never,
	isProd?: boolean,
) => {
	const dashboardNum = dashboardNums[scopeType][dashboardType];

	if (!dashboardNum) {
		return null;
	}

	const payload = {
		// @ts-expect-error
		resource: { dashboard: dashboardNum?.id },
		params: {
			[scopeType]: scopeId,
			...((scopeType === 'collection' &&
				dashboardType === 'new' &&
				// @ts-expect-error
				'options' in dashboardNum &&
				dashboardNum.options) ||
				{}),
			...(isProd !== undefined && { is_prod: isProd }),
		},
		exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minute expiration
	};

	const metabaseSecretKey = process.env.METABASE_SECRET_KEY;

	if (!metabaseSecretKey) {
		throw new Error('METABASE_SECRET_KEY environment variable not set');
	}

	return jwt.sign(payload, metabaseSecretKey);
};
