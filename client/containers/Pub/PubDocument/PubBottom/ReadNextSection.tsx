import React from 'react';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'types/pub' or its correspondin... Remove this comment to see the full error message
import { pubDataProps } from 'types/pub';
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
	pubData: pubDataProps;
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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never[] ... Remove this comment to see the full error message
			centerItems={
				// @ts-expect-error ts-migrate(2786) FIXME: 'SectionBullets' cannot be used as a JSX component... Remove this comment to see the full error message
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
