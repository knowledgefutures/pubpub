import React from 'react';

import { CollectionPub, DefinitelyHas, Pub } from 'types';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { PubTitle } from 'components';
import { chooseCollectionForPub, createReadingParamUrl } from 'client/utils/collections';

import PubBottomSection, { SectionBullets } from './PubBottomSection';

type Props = {
	pubData: Pub & { nextCollectionPub?: DefinitelyHas<CollectionPub, 'pub'> };
};

const ReadNextSection = (props: Props) => {
	const { pubData } = props;
	const { locationData, communityData } = usePageContext();
	const nextPub = pubData.nextCollectionPub?.pub;
	const currentCollection = chooseCollectionForPub(pubData, locationData);

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
						<PubTitle pubData={nextPub} />
					</a>
				</SectionBullets>
			}
		/>
	);
};
export default ReadNextSection;
