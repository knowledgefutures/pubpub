/**
 * Renders a submission for a book.
 */
import book from '../schema/book';
import contentItem from '../schema/contentItem';

import transformCollection from '../transform/collection';
import transformCollectionPub from '../transform/collectionPub';
import transformPub from '../transform/pub';

export default ({ globals, community, collection, pub, collectionPub }) => {
	const pubProps = pub && transformPub({ globals, community })(pub);
	const collectionProps = transformCollection({ globals, community })(collection);
	const { componentType } = (collectionPub && transformCollectionPub(collectionPub)) || {};
	return book({
		...collectionProps,
		children: {
			...(pubProps &&
				contentItem({ ...pubProps, componentType: componentType || 'section' })),
		},
	});
};
