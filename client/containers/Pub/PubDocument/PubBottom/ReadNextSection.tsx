import React from 'react';

import { Pub } from 'utils/types';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import {
	chooseCollectionForPub,
	createReadingParamUrl,
	getNeighborsInCollectionPub,
	useCollectionPubs,
} from 'client/utils/collections';
import { usePubContext } from '../../pubHooks';

import PubBottomSection, { SectionBullets } from './PubBottomSection';

type Props = {
	pubData: Pub;
};

const ReadNextSection = (props: Props) => {
	const { pubData } = props;
	const { locationData, communityData } = usePageContext();
	const { updateLocalData } = usePubContext();
	const currentCollection = chooseCollectionForPub(pubData, locationData);
	const { pubs } = useCollectionPubs(updateLocalData, currentCollection);
	const { nextPub } = getNeighborsInCollectionPub(pubs, pubData);
	const { readNextPreviewSize = 'choose-best' } = currentCollection || {};

	if (readNextPreviewSize === 'none' || !nextPub || !currentCollection) {
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
							currentCollection.id,
						)}
					>
						{nextPub.title}
					</a>
				</SectionBullets>
			}
		/>
	);
};
export default ReadNextSection;
