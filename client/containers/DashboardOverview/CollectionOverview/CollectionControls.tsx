import React from 'react';
import { Button } from '@blueprintjs/core';

import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

import PubSelect from './PubSelect';

type Props = {
	overviewData: any;
	collection: any;
	updateCollection: (...args: any[]) => any;
	collectionPubs: any[];
	addCollectionPub: (...args: any[]) => any;
};

const CollectionControls = (props: Props) => {
	const { overviewData, collection, updateCollection, collectionPubs, addCollectionPub } = props;
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const { isPublic } = collection;

	if (!canManage) {
		return null;
	}
	return (
		<>
			<PubSelect
				pubs={overviewData.pubs}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				usedPubIds={collectionPubs.map((cp) => cp.pubId)}
				onSelectPub={addCollectionPub}
			>
				<Button outlined icon="plus">
					Add Pubs
				</Button>
			</PubSelect>
			{!isPublic && (
				<Button
					intent="primary"
					icon="globe"
					onClick={() => updateCollection({ isPublic: true })}
				>
					Make public
				</Button>
			)}
			{isPublic && (
				<MenuButton
					aria-label="Make this collection private"
					buttonContent="Public"
					buttonProps={{
						icon: 'tick',
						rightIcon: 'caret-down',
						outlined: true,
					}}
				>
					<MenuItem
						text="Make private"
						onClick={() => updateCollection({ isPublic: false })}
					/>
				</MenuButton>
			)}
		</>
	);
};
export default CollectionControls;
