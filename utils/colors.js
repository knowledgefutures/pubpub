import Color from 'color';

export const calculateBackgroundColor = (headerBackgroundColor, accentColorDark) => {
	if (headerBackgroundColor && headerBackgroundColor === 'community') {
		return Color(accentColorDark)
			.darken(0.2)
			.alpha(0.75)
			.toString();
	}
	if (headerBackgroundColor === 'dark') {
		return 'rgba(0, 0, 0, 0.65)';
	}
	if (headerBackgroundColor === 'light') {
		return 'rgba(0, 0, 0, 0.0275)';
	}
	return headerBackgroundColor;
};

export const getRandomColor = (loginId) => {
	const colors = [
		'244,67,54',
		'63,81,181',
		'0,150,136',
		'255,152,0',
		'96,125,139',
		'233,30,99',
		'3,169,244',
		'156,39,176',
		'139,195,74',
		'103,58,183',
		'121,85,72',
		'33,150,243',
		'255,193,7',
		'0,188,212',
		'76,175,80',
		'205,220,57',
		'255,87,34',
	];
	if (!loginId) {
		return colors[0];
	}
	return colors[loginId.charCodeAt(loginId.length - 1) % colors.length];
};
