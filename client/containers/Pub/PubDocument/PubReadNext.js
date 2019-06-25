import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import {
	chooseCollectionForPub,
	createReadingParamUrl,
	getNeighborsInCollectionPub,
	useCollectionPubs,
} from 'utils/collections';
import { pubDataProps } from 'types/pub';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import PubPreview from 'components/PubPreview/PubPreview';

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubReadNext = (props) => {
	const { pubData, updateLocalData } = props;
	const { locationData, communityData } = useContext(PageContext);
	const currentCollection = chooseCollectionForPub(pubData, locationData);
	const { pubs } = useCollectionPubs(updateLocalData, currentCollection);
	const { nextPub } = getNeighborsInCollectionPub(pubs, pubData);
	if (!nextPub) {
		return null;
	}
	return (
		<div className="pub-read-next-component">
			<GridWrapper containerClassName="pub">
				<h2>Read next from {currentCollection.title}</h2>
				<PubPreview
					pubData={nextPub}
					customPubUrl={createReadingParamUrl(
						pubUrl(communityData, pubData),
						currentCollection,
					)}
				/>
			</GridWrapper>
		</div>
	);
};

PubReadNext.propTypes = propTypes;
export default PubReadNext;
