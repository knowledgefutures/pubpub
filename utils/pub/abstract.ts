import type { DocJson } from 'types';

export const getAbstractDocFromPubDoc = (doc: DocJson): null | DocJson => {
	const {
		content: [firstChild, secondChild],
	} = doc;

	if (firstChild && secondChild) {
		const { type: firstChildType, attrs, content } = firstChild;

		const hasCorrectHeading =
			firstChildType === 'heading' &&
			attrs?.level === 1 &&
			content?.[0]?.text?.toLowerCase()?.trim() === 'abstract';

		if (hasCorrectHeading) {
			if (secondChild.type === 'paragraph') {
				return { type: 'doc', attrs: {}, content: [secondChild] };
			}
		}
	}
	return null;
};
