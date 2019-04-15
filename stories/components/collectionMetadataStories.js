import * as React from 'react';
import { storiesOf } from '@storybook/react';

import CollectionMetadataEditor from 'components/CollectionMetadata/CollectionMetadataEditor';
import collection from '../dataCollection';
import community from '../dataCommunity';

storiesOf('Components/Collections/CollectionMetadataEditor', module).add('default', () => (
	<CollectionMetadataEditor
		collection={collection}
		communityData={community}
		onPersistStateChange={() => {}}
		onCollectionUpdate={() => {}}
	/>
));
