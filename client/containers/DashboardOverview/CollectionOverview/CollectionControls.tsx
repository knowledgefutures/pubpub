import React from 'react';
import { Button } from '@blueprintjs/core';

import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { Collection, PubWithCollections } from 'types';

import PubSelect from './PubSelect';

type Props = {
	collection: Collection;
	updateCollection: (patch: Partial<Collection>) => unknown;
	addCollectionPub: (pub: PubWithCollections) => unknown;
	usedPubIds: Set<string>;
};

const CollectionControls = (props: Props) => {
	const { usedPubIds, collection, updateCollection, addCollectionPub } = props;
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const { isPublic, isRestricted } = collection;

	if (!canManage) {
		return null;
	}
	return (
		<>
			<PubSelect
				usedPubIds={usedPubIds}
				onSelectPub={addCollectionPub}
				collectionId={collection.id}
			>
				<Button outlined icon="plus">
					Add Pubs
				</Button>
			</PubSelect>
			<MenuButton
				aria-label="Choose whether this Collection is restricted"
				buttonContent={isRestricted ? 'Restricted' : 'Open'}
				placement="bottom-end"
				buttonProps={{
					minimal: true,
					outlined: true,
					icon: isRestricted ? 'folder-close' : 'folder-open',
					rightIcon: 'caret-down',
				}}
			>
				<MenuItem
					text={
						<>
							<b>Restricted:</b> only managers of this Collection can add Pubs
						</>
					}
					icon={isRestricted ? 'tick' : 'blank'}
					onClick={() => updateCollection({ isRestricted: true })}
				/>
				<MenuItem
					text={
						<>
							<b>Open:</b> anyone in this Community can add their Pub
						</>
					}
					icon={isRestricted ? 'blank' : 'tick'}
					onClick={() => updateCollection({ isRestricted: false })}
				/>
			</MenuButton>
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
