import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getSchemaForKind } from 'utils/collections/schemas';
import { MenuButton, MenuItem, MenuItemDivider } from 'components/Menu';

const propTypes = {
	collection: PropTypes.shape({
		isPublic: PropTypes.bool,
		kind: PropTypes.string,
	}).isRequired,
	collectionPub: PropTypes.object.isRequired,
	setCollectionPubContextHint: PropTypes.func.isRequired,
	setCollectionPubIsPrimary: PropTypes.func.isRequired,
	removeCollectionPub: PropTypes.func.isRequired,
};

const PubMenu = (props) => {
	const {
		collectionPub,
		collection,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		removeCollectionPub,
	} = props;
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const { activeCollection } = scopeData.elements;
	const collectionSchema = getSchemaForKind(activeCollection.kind);
	const canSetCollectionAsPrimary = collection.isPublic && collection.kind !== 'tag';

	if (!canManage) {
		return null;
	}
	return (
		<React.Fragment>
			<MenuButton
				aria-label="More pub options"
				buttonProps={{
					small: true,
					minimal: true,
					icon: 'more',
				}}
				placement="bottom-end"
			>
				{canSetCollectionAsPrimary && (
					<>
						<MenuItem
							text="Use as primary collection"
							icon={collectionPub.isPrimary ? 'tick' : 'blank'}
							onClick={() =>
								setCollectionPubIsPrimary(collectionPub, !collectionPub.isPrimary)
							}
						/>
						<MenuItemDivider />
					</>
				)}
				<MenuItem
					text={<i>(No label)</i>}
					icon={!collectionPub.contextHint ? 'tick' : 'blank'}
					onClick={() => setCollectionPubContextHint(collectionPub, null)}
				/>
				{collectionSchema.contextHints.map((hint) => (
					<MenuItem
						key={hint.value}
						text={hint.label}
						icon={collectionPub.contextHint === hint.value ? 'tick' : 'blank'}
						onClick={() => setCollectionPubContextHint(collectionPub, hint.value)}
					/>
				))}
			</MenuButton>
			<Button
				small
				minimal
				icon="cross"
				aria-label="Remove this Pub from collection"
				onClick={() => removeCollectionPub(collectionPub)}
			/>
		</React.Fragment>
	);
};

PubMenu.propTypes = propTypes;
export default PubMenu;
