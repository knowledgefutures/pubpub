import React from 'react';
import dateFormat from 'dateformat';

import { LicenseSelect } from 'components';
import { usePageContext } from 'utils/hooks';
import { getLicenseBySlug } from 'utils/licenses';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import PubBottomSection, { SectionBullets, AccentedIconButton } from './PubBottomSection';

type Props = {
	pubData: {
		canManage?: boolean;
		licenseSlug?: string;
		collectionPubs?: any[];
	};
	updateLocalData: (...args: any[]) => any;
};

const LicenseSection = (props: Props) => {
	const { pubData, updateLocalData } = props;
	const { communityData, scopeData } = usePageContext();
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'link' does not exist on type '{ slug: st... Remove this comment to see the full error message
	const { link, full, short, version, slug } = getLicenseBySlug(pubData.licenseSlug);
	// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
	const primaryCollectionPub = pubData.collectionPubs.find((cp) => cp.isPrimary);
	const collectionPubDate = primaryCollectionPub
		? primaryCollectionPub.collection.metadata.copyrightYear ||
		  primaryCollectionPub.collection.metadata.date ||
		  primaryCollectionPub.collection.metadata.publicationDate
		: null;
	const pubCopyrightDate =
		dateFormat(collectionPubDate, 'yyyy') || dateFormat(getPubPublishedDate(pubData), 'yyyy');
	let pubPublisher = communityData.title;
	if (communityData.id === '78810858-8c4a-4435-a669-6bb176b61d40') {
		pubPublisher = 'Massachusetts Institute of Technology';
	}

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isExpandable={false}
			className="pub-bottom-license"
			title="License"
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' is missing in type 'Element' b... Remove this comment to see the full error message
			centerItems={
				<React.Fragment>
					{slug === 'copyright' && (
						// @ts-expect-error ts-migrate(2786) FIXME: Type 'Element[]' is missing the following properti... Remove this comment to see the full error message
						<SectionBullets>
							<span>
								Copyright © {pubCopyrightDate} {pubPublisher}. (All rights
								reserved.)
							</span>
						</SectionBullets>
					)}
					{slug !== 'copyright' && (
						// @ts-expect-error ts-migrate(2786) FIXME: Its return type 'Element[]' is not a valid JSX ele... Remove this comment to see the full error message
						<SectionBullets>
							<a target="_blank" rel="license noopener noreferrer" href={link}>
								{`${full} (${short} ${version})`}
							</a>
						</SectionBullets>
					)}
				</React.Fragment>
			}
			// @ts-expect-error ts-migrate(2322) FIXME: Type '({ iconColor }: { iconColor: any; }) => Elem... Remove this comment to see the full error message
			iconItems={({ iconColor }) => {
				if (scopeData.activePermissions.canManage) {
					return (
						<LicenseSelect pubData={pubData} updateLocalData={updateLocalData}>
							{({ isPersisting }) => (
								<AccentedIconButton
									accentColor={iconColor}
									icon="edit"
									title="Select Pub license"
									loading={isPersisting}
								/>
							)}
						</LicenseSelect>
					);
				}
				return null;
			}}
		/>
	);
};
export default LicenseSection;
