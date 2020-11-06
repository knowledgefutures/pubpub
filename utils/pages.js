export const generatePageBackground = (pageTitle) => {
	const gradients = ['#b33939', '#cd6133', '#474787', '#227093', '#218c74'];

	if (!pageTitle) {
		return gradients[0];
	}
	return gradients[pageTitle.charCodeAt(pageTitle.length - 1) % 5];
};

export const getDefaultLayout = () => {
	return [
		{
			id: '0kyj32ay',
			type: 'pubs',
			content: {
				title: '',
				size: 'large',
				limit: 1,
				pubIds: [],
			},
		},
		{
			id: 'gruw36cv',
			type: 'pubs',
			content: {
				title: '',
				size: 'medium',
				limit: 0,
				pubIds: [],
			},
		},
	];
};
