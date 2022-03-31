import { DocJson } from 'types';

export const getAbstractDocFromPubDoc = (doc: DocJson): null | DocJson => {
	const {
		content: [firstChild, secondChild],
	} = doc;

	if (firstChild && secondChild) {
		const {
			type: firstChildType,
			attrs,
			content: [firstTextItem],
		} = firstChild;

		const hasCorrectHeading =
			firstChildType === 'heading' &&
			attrs?.level === 1 &&
			firstTextItem?.text?.toLowerCase?.() === 'abstract';

		if (hasCorrectHeading) {
			if (secondChild.type === 'paragraph') {
				return { type: 'doc', attrs: {}, content: [secondChild] };
			}
		}
	}
	return null;
};
