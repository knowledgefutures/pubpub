import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

import { LicenseSelect } from 'components';
import { usePageContext } from 'utils/hooks';
import { getLicenseBySlug } from 'utils/licenses';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import PubBottomSection, { SectionBullets, AccentedIconButton } from './PubBottomSection';

const propTypes = {
	pubData: PropTypes.shape({
		canManage: PropTypes.bool,
		licenseSlug: PropTypes.string,
		collectionPubs: PropTypes.array,
	}).isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const LicenseSection = (props) => {
	const { pubData, updateLocalData } = props;
	const { communityData, scopeData } = usePageContext();
	const { link, full, short, version, slug } = getLicenseBySlug(pubData.licenseSlug);
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
			centerItems={
				<React.Fragment>
					{slug === 'copyright' && (
						<SectionBullets>
							<span>
								Copyright © {pubCopyrightDate} {pubPublisher}. (All rights
								reserved.)
							</span>
						</SectionBullets>
					)}
					{slug !== 'copyright' && (
						<SectionBullets>
							<a target="_blank" rel="license noopener noreferrer" href={link}>
								{`${full} (${short} ${version})`}
							</a>
						</SectionBullets>
					)}
				</React.Fragment>
			}
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

LicenseSection.propTypes = propTypes;
export default LicenseSection;
