import React, { useState } from 'react';

import { PubMenuItem, QueryListDropdown } from 'components';
import { PubWithCollections } from 'types';
import { useManyPubs } from 'client/utils/useManyPubs';

import { LoadMorePubsRow } from '../overviewRows';

type Props = {
	children: React.ReactNode;
	onSelectPub: (pub: PubWithCollections) => unknown;
	usedPubIds: Set<string>;
	collectionId: string;
};

const PubSelect = (props: Props) => {
	const { children, onSelectPub, collectionId, usedPubIds } = props;
	const [searchTerm, setSearchTerm] = useState('');

	const {
		allQueries: { isLoading },
		currentQuery: { pubs },
	} = useManyPubs<PubWithCollections>({
		batchSize: 50,
		query: {
			term: searchTerm,
			excludeCollectionIds: [collectionId],
			ordering: { field: 'updatedDate', direction: 'DESC' },
		},
		pubOptions: {
			getCollections: true,
		},
	});

	const renderPubItem = (pub, { handleClick, modifiers: { active } }) => {
		return (
			<PubMenuItem
				key={pub.id}
				id={pub.id}
				onClick={handleClick}
				title={pub.title}
				contributors={pub.attributions}
				active={active}
			/>
		);
	};

	return (
		<QueryListDropdown
			itemRenderer={renderPubItem}
			items={pubs.filter((pub) => !usedPubIds.has(pub.id))}
			onQueryChange={setSearchTerm}
			onItemSelect={onSelectPub}
			emptyListPlaceholder={isLoading ? <LoadMorePubsRow isLoading /> : 'No Pubs to show'}
			searchPlaceholder="Search for Pubs"
			children={children}
			query={searchTerm}
		/>
	);
};
export default PubSelect;
