import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
	AnchorButton,
	Button,
	ButtonGroup,
	Menu,
	MenuItem,
	Popover,
	Position,
} from '@blueprintjs/core';

import {
	createReadingParamUrl,
	useCollectionPubs,
	getNeighborsInCollectionPub,
} from 'utils/collections';
import collectionType from 'types/collection';
import { pubDataProps } from 'types/pub';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { getSchemaForKind } from 'shared/collections/schemas';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import PubPreviewImage from 'components/PubPreview/PubPreviewImage';

require('./collectionBrowser.scss');

const propTypes = {
	className: PropTypes.string,
	collection: collectionType.isRequired,
	currentPub: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const defaultProps = {
	className: '',
};

const CollectionBrowser = (props) => {
	const { className, collection, currentPub, updateLocalData } = props;
	const { communityData } = useContext(PageContext);
	const { isLoading, pubs } = useCollectionPubs(updateLocalData, collection);
	const { bpDisplayIcon } = getSchemaForKind(collection.kind);
	const { previousPub, nextPub } = getNeighborsInCollectionPub(pubs, currentPub);
	const readingPubUrl = (pub) => createReadingParamUrl(pubUrl(communityData, pub), collection);
	return (
		<div className="collection-browser-component">
			<ButtonGroup className={className}>
				<AnchorButton
					disabled={!previousPub}
					href={previousPub && readingPubUrl(previousPub)}
					icon="arrow-left"
				/>
				<Popover
					minimal
					position={Position.TOP_LEFT}
					modifiers={{ preventOverflow: { enabled: false }, hide: { enabled: false } }}
					content={
						<Menu className="collection-browser-component_menu">
							{pubs &&
								pubs.map((pub) => (
									<MenuItem
										href={readingPubUrl(pub)}
										textClassName="menu-item-text"
										icon={
											<PubPreviewImage
												className="pub-preview"
												pubData={pub}
												fitIn={100}
											/>
										}
										key={pub.id}
										text={pub.title}
									/>
								))}
						</Menu>
					}
				>
					<Button loading={isLoading} icon={bpDisplayIcon}>
						{collection.title}
					</Button>
				</Popover>
				<AnchorButton
					disabled={!nextPub}
					href={nextPub && readingPubUrl(nextPub)}
					icon="arrow-right"
				/>
			</ButtonGroup>
		</div>
	);
};

CollectionBrowser.propTypes = propTypes;
CollectionBrowser.defaultProps = defaultProps;
export default CollectionBrowser;
