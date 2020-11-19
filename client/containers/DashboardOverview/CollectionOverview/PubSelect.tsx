import React from 'react';

import { PubMenuItem, QueryListDropdown } from 'components';
import { fuzzyMatchPub } from 'utils/fuzzyMatch';
import { Pub } from 'utils/types';

type Props = {
	children: React.ReactNode;
	onSelectPub: (pub: Pub) => unknown;
	pubs: Pub[];
	usedPubIds?: string[];
};

const PubSelect = (props: Props) => {
	const { children, pubs, onSelectPub, usedPubIds = [] } = props;

	const renderPubItem = (pub, { handleClick, modifiers: { active } }) => {
		return (
			<PubMenuItem
				key={pub.id}
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
			items={pubs.filter((pub) => !usedPubIds.includes(pub.id))}
			itemPredicate={(query, pub) => fuzzyMatchPub(pub, query)}
			onItemSelect={onSelectPub}
			emptyListPlaceholder="No Pubs to show."
			searchPlaceholder="Search for Pubs"
			children={children}
		/>
	);
};
export default PubSelect;
