import React from 'react';
import PropTypes from 'prop-types';

import { pubDataProps } from 'types/pub';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import {
	chooseCollectionForPub,
	createReadingParamUrl,
	getNeighborsInCollectionPub,
	useCollectionPubs,
} from 'client/utils/collections';

import PubBottomSection, { SectionBullets } from './PubBottomSection';

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const ReadNextSection = (props) => {
	const { pubData, updateLocalData } = props;
	const { locationData, communityData } = usePageContext();
	const currentCollection = chooseCollectionForPub(pubData, locationData);
	const { pubs } = useCollectionPubs(updateLocalData, currentCollection);
	const { nextPub } = getNeighborsInCollectionPub(pubs, pubData);
	const { readNextPreviewSize = 'choose-best' } = currentCollection || {};
	if (readNextPreviewSize === 'none') {
		return null;
	}
	if (!nextPub) {
		return null;
	}
	return (
		<PubBottomSection
			isExpandable={false}
			title="Read Next"
			centerItems={
				<SectionBullets>
					<a
						href={createReadingParamUrl(
							pubUrl(communityData, nextPub),
							currentCollection,
						)}
					>
						{nextPub.title}
					</a>
				</SectionBullets>
			}
		/>
	);
};

ReadNextSection.propTypes = propTypes;
export default ReadNextSection;
