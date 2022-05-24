import { useEffect } from 'react';

import { usePageContext } from 'utils/hooks';
import { setLocalHighlight } from 'components/Editor';

import { usePubContext } from './pubHooks';

export const usePermalinkOnMount = () => {
	const {
		locationData: {
			query: { from, to },
		},
	} = usePageContext();
	const {
		collabData: { editorChangeObject },
	} = usePubContext();

	const editorView = editorChangeObject?.view;

	useEffect(() => {
		const existingPermElement = document.getElementsByClassName('permanent')[0];
		if (editorView && from && to && !existingPermElement) {
			setTimeout(() => {
				setLocalHighlight(editorView, parseInt(from, 10), parseInt(to, 10), 'permanent');
				setTimeout(() => {
					const newlyCreatedPermElement = document.getElementsByClassName('permanent')[0];
					if (newlyCreatedPermElement) {
						newlyCreatedPermElement.scrollIntoView({ block: 'center' });
					}
				}, 0);
			}, 0);
		}
	}, [editorView, from, to]);
};
