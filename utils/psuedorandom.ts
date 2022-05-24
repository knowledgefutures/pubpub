const largestSixByteInteger = 0xffffffffffff;

export const getPsuedorandomFractionForUuid = (uuid: string) => {
	const sixBytesString = uuid.split('-').pop()!;
	const sixBytesInt = parseInt(sixBytesString, 16);
	// This function should have the same range as Math.random -- [0, 1) -- so if we happen to get
	// the largest possible UUID prefix, we quietly knock it down by 1. This weights the function
	// just a tiny bit on one end of the distrubution, which should...never matter.
	const numerator = sixBytesInt === largestSixByteInteger ? sixBytesInt - 1 : sixBytesInt;
	return numerator / largestSixByteInteger;
};

export const getPsuedorandomChoiceForUuid = <T>(uuid: string, choices: T[]): T => {
	const fraction = getPsuedorandomFractionForUuid(uuid);
	const index = Math.floor(choices.length * fraction);
	return choices[index];
};
