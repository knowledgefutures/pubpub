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
		return 'rgba(0, 0, 0, 0.01)';
	}
	return headerBackgroundColor;
};
