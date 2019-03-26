import * as React from 'react';
import { storiesOf } from '@storybook/react';

import CollectionEditor from 'components/CollectionEditor/CollectionEditor';

const TEST_COLLECTION = {
	kind: 'book',
	id: 'pretend-its-a-uuid',
	title: 'A Real Life Book',
	collectionPubs: [],
};

const TEST_AUTHORS = {
	ANNE: { name: 'Anne Burns' },
	CARLOS: { name: 'Carlos Delgado' },
	EMILY: { name: 'Emily Firenze' },
	GRANT: { name: 'Grant Huang' },
};

const TEST_COLLECTION_PUBS = {
	GOOD: { collection: { title: 'Good' } },
	BAD: { collection: { title: 'Bad' } },
};

const TEST_PUBS = [
	{
		id: '0',
		title: 'A pub',
		attributions: [TEST_AUTHORS.ANNE],
		collectionPubs: [TEST_COLLECTION_PUBS.GOOD],
	},
	{ id: '1', title: 'Another pub', attributions: [TEST_AUTHORS.CARLOS], collectionPubs: [] },
	{
		id: '2',
		title: 'Wow, yet another pub',
		attributions: [TEST_AUTHORS.ANNE, TEST_AUTHORS.EMILY],
		collectionPubs: [],
	},
	{
		id: '3',
		title: 'Where are we getting all of these pubs?',
		attributions: [TEST_AUTHORS.GRANT],
		collectionPubs: [TEST_COLLECTION_PUBS.BAD],
	},
];

storiesOf('Components/Collections/CollectionEditor', module).add('default', () => (
	<CollectionEditor collection={TEST_COLLECTION} pubs={TEST_PUBS} selections={[]} />
));
