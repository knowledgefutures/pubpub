import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Card, Menu, MenuDivider, MenuItem, Popover } from '@blueprintjs/core';

import collectionType from 'types/collection';
import communityType from 'types/community';
import { getSchemaForKind } from 'shared/collections/schemas';
import { Icon } from 'components';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const propTypes = {
	collection: collectionType.isRequired,
	communityData: communityType.isRequired,
	onDeleteCollection: PropTypes.func.isRequired,
	onUpdateCollection: PropTypes.func.isRequired,
};

const CollectionOptionsMenu = ({
	communityData,
	collection,
	onDeleteClick,
	onUpdateCollection,
}) => {
	return (
		<Popover
			minimal
			autoFocus={false}
			className="more-options-menu"
			content={
				<Menu>
					<MenuItem icon="link" text="Link to page">
						<MenuItem
							text={<em>None</em>}
							onClick={() => onUpdateCollection({ pageId: null })}
							icon={!collection.pageId && 'tick'}
						/>
						<MenuDivider />
						{communityData.pages.map((page) => (
							<MenuItem
								text={page.title}
								icon={page.id === collection.pageId && 'tick'}
								onClick={() => onUpdateCollection({ pageId: page.id })}
							/>
						))}
					</MenuItem>
					<MenuItem
						icon={<Icon icon={collection.isPublic ? 'lock2' : 'globe'} />}
						text={collection.isPublic ? 'Make Private' : 'Make public'}
						onClick={() =>
							onUpdateCollection({
								id: collection.id,
								isPublic: !collection.isPublic,
							})
						}
					/>
					<MenuDivider />
					<MenuItem icon="trash" intent="danger" onClick={onDeleteClick} text="Delete" />
				</Menu>
			}
		>
			<Button icon="more" small minimal />
		</Popover>
	);
};

CollectionOptionsMenu.propTypes = { ...propTypes, onDeleteClick: PropTypes.func.isRequired };

const CollectionTile = (props) => {
	const { collection, onDeleteCollection } = props;
	const [isDeleting, setIsDeleting] = useState(false);
	const schema = getSchemaForKind(collection.kind);
	return (
		<Card className="collection-tile">
			<Alert
				isOpen={isDeleting}
				intent="danger"
				icon="trash"
				onConfirm={() => {
					onDeleteCollection();
					setIsDeleting(false);
				}}
				onCancel={() => setIsDeleting(false)}
				cancelButtonText="Cancel"
				confirmButtonText="Delete"
				canEscapeKeyCancel={true}
			>
				Are you sure you want to delete <em>{collection.title}</em>?
			</Alert>
			<div className="contents" title={collection.title}>
				<a href={`/dashboard/collections/${collection.id}`} className="title">
					{collection.title}
				</a>
				<div className="info-container">
					<div className="info-label">
						<Icon iconSize={10} icon={schema.bpDisplayIcon} />
						{capitalize(schema.label.singular)}
					</div>
					<div className="info-label">
						<Icon iconSize={10} icon={collection.isPublic ? 'globe' : 'lock2'} />
						{collection.isPublic ? 'Public' : 'Private'}
					</div>
					{collection.page && (
						<div className="info-label shrinks">
							<Icon iconSize={10} icon="link" />
							{collection.page.title}
						</div>
					)}
					<CollectionOptionsMenu {...props} onDeleteClick={() => setIsDeleting(true)} />
				</div>
			</div>
		</Card>
	);
};

CollectionTile.propTypes = propTypes;
export default CollectionTile;
