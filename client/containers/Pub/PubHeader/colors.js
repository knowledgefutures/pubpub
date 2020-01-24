import Color from 'color';

export const calculateBackgroundColor = (headerBackgroundColor, accentColorDark) => {
	if (headerBackgroundColor && headerBackgroundColor === 'community') {
		return Color(accentColorDark)
			.alpha(0.75)
			.mix(Color('black').alpha(0.2));
	}
	if (headerBackgroundColor === 'dark') {
		return 'rgba(0, 0, 0, 0.5)';
	}
	return headerBackgroundColor;
};
