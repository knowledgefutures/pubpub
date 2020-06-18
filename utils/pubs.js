export const generatePubBackground = (pubTitle) => {
	const gradients = [
		'linear-gradient(135deg, #cb2d3e, #ef973a)',
		'linear-gradient(-45deg, #00bf8f, #001510)',
		'linear-gradient(135deg, #2c3e50, #4ca1af)',
		'linear-gradient(-45deg, #ad5389, #3c1053)',
		'linear-gradient(135deg, #000046, #1cb5e0)',
		// 'linear-gradient(to right, rgba(116, 235, 213, 1), rgba(172, 182, 229, 1))',
		// 'linear-gradient(to right, rgba(225, 238, 195, 1), rgba(240, 80, 83, 1))',
		// 'linear-gradient(to right, rgba(34, 193, 195, 1), rgba(253, 187, 45, 1))',
		// 'linear-gradient(to right, rgba(217, 167, 199, 1), rgba(255, 252, 220, 1))',
		// 'linear-gradient(to right, rgba(201, 214, 255, 1), rgba(226, 226, 226, 1))'
	];

	if (!pubTitle) {
		return gradients[0];
	}
	return gradients[pubTitle.charCodeAt(pubTitle.length - 1) % 5];
};
