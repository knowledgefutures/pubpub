let isPubPubProduction;

export const setIsProd = (val) => {
	isPubPubProduction = val;
};

export const isProd = () => {
	return isPubPubProduction;
};
