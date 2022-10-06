import React, { useState } from 'react';
import { Button, Icon, Tooltip, Divider } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getSchemaForKind } from 'utils/collections/schemas';
import { PopoverButton, PrimaryCollectionExplanation } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { getPrimaryCollection } from 'utils/collections/primary';
import { Collection, CollectionPub, PubWithCollections } from 'types';

type Props = {
	collection: Collection;
	collectionPub: CollectionPub;
	pub: PubWithCollections;
	setCollectionPubContextHint: (c: CollectionPub, hint: null | string) => unknown;
	setCollectionPubIsPrimary: (c: CollectionPub) => unknown;
	removeCollectionPub: (c: CollectionPub) => unknown;
};

const ButtonWithRef = React.forwardRef((props: any, ref: any) => (
	<Button {...props} elementRef={ref} />
));

const derivePrimaryCollection = (
	collectionPub: CollectionPub,
	pub: PubWithCollections,
	collection: Collection,
) => {
	const { collectionPubs } = pub;
	const linkedCollectionPub = { ...collectionPub, collection };
	const collectionPubsPool =
		collectionPubs.length > 0
			? // Make sure to look at the most recent version of this CollectionPub
			  collectionPubs.map((cp) => (cp.id === collectionPub.id ? linkedCollectionPub : cp))
			: // In truth there must be at least one CollectionPub (this one) even if it's not
			  // referenced in collectionPub.pub yet -- possibly it was recently created.
			  [linkedCollectionPub];
	return getPrimaryCollection(collectionPubsPool);
};

const PubMenu = (props: Props) => {
	const {
		collectionPub,
		collection,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		removeCollectionPub,
		pub,
	} = props;
	const [justSetPrimary, setJustSetPrimary] = useState(false);
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;

	if (!canManage) {
		return null;
	}

	const collectionSchema = getSchemaForKind(collection.kind);
	const primaryCollection = derivePrimaryCollection(collectionPub, pub, collection);
	const isPrimary = justSetPrimary || primaryCollection?.id === collection.id;

	const renderPrimaryCollectionButton = () => {
		if (isPrimary) {
			return (
				<Tooltip
					position="left"
					content={
						<>
							<Icon icon="tick" /> This Pub's Primary Collection
						</>
					}
				>
					<Button
						aria-label="This Pub's Primary Collection"
						minimal
						small
						icon={<Icon icon="star" iconSize={14} />}
					/>
				</Tooltip>
			);
		}
		return (
			<PopoverButton
				component={() => (
					<div className="primary-collection-swap-popover">
						{primaryCollection && (
							<>
								This Pub's <PrimaryCollectionExplanation /> is currently{' '}
								<i>{primaryCollection.title}</i>.
								<Divider />
							</>
						)}
						<Button
							intent="primary"
							onClick={() => {
								setCollectionPubIsPrimary(collectionPub);
								setJustSetPrimary(true);
							}}
						>
							{primaryCollection
								? 'Use this Collection instead'
								: 'Use as Primary Collection'}
						</Button>
					</div>
				)}
				aria-label="Make this the Primary Collection for this Pub"
			>
				<ButtonWithRef
					minimal
					small
					icon={<Icon icon="star-empty" iconSize={14} />}
					elementRef
				/>
			</PopoverButton>
		);
	};

	const renderNonTagButtons = () => {
		return (
			<>
				{collection.isPublic && renderPrimaryCollectionButton()}
				<MenuButton
					aria-label="Collection context hint"
					buttonProps={{
						small: true,
						minimal: true,
						icon: <Icon icon="properties" iconSize={14} />,
					}}
					placement="bottom-end"
				>
					<MenuItem
						text={<i>(No label)</i>}
						icon={!collectionPub.contextHint ? 'tick' : 'blank'}
						onClick={() => setCollectionPubContextHint(collectionPub, null)}
					/>
					{/* @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'. */}
					{collectionSchema.contextHints.map((hint) => (
						<MenuItem
							key={hint.value}
							text={hint.label}
							icon={collectionPub.contextHint === hint.value ? 'tick' : 'blank'}
							onClick={() => setCollectionPubContextHint(collectionPub, hint.value)}
						/>
					))}
				</MenuButton>
			</>
		);
	};

	return (
		<React.Fragment>
			{collection.kind !== 'tag' && renderNonTagButtons()}
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
export default PubMenu;
