import jwt from 'jsonwebtoken';

export const generateMetabaseToken = (scopeType, scopeId, dashboardType) => {
	const dashboardNums = {
		community: {
			base: 2,
			benchmark: 8,
		},
		pub: {
			base: 3,
			benchmark: 9,
		},
	};
	const dashboardNum = dashboardNums[scopeType][dashboardType];
	const payload = {
		resource: { dashboard: dashboardNum },
		params: {
			[scopeType]: scopeId,
		},
		exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minute expiration
	};
	return jwt.sign(payload, process.env.METABASE_SECRET_KEY);
};
