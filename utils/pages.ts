import { generateHash } from './hashes';
import { LayoutBlock } from './layout';

export const generatePageBackground = (pageTitle: string) => {
	const gradients = ['#b33939', '#cd6133', '#474787', '#227093', '#218c74'];

	if (!pageTitle) {
		return gradients[0];
	}
	return gradients[pageTitle.charCodeAt(pageTitle.length - 1) % 5];
};

export const generateDefaultPageLayout = (): LayoutBlock[] => {
	return [
		{
			id: generateHash(8),
			type: 'pubs',
			content: {
				title: '',
				pubPreviewType: 'large',
				limit: 1,
				pubIds: [],
			},
		},
		{
			id: generateHash(8),
			type: 'pubs',
			content: {
				title: '',
				pubPreviewType: 'medium',
				limit: 0,
				pubIds: [],
			},
		},
	];
};
