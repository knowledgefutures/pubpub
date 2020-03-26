import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { LicenseSelect } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { getLicenseBySlug } from 'shared/license';
import dateFormat from 'dateformat';

import { getPubPublishedDate } from 'shared/pub/pubDates';
import PubBottomSection, { SectionBullets, AccentedIconButton } from './PubBottomSection';

const propTypes = {
	pubData: PropTypes.shape({
		canManage: PropTypes.bool,
		licenseSlug: PropTypes.string,
		collectionPubs: PropTypes.object,
	}).isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const LicenseSection = (props) => {
	const { pubData, updateLocalData } = props;
	const { communityData } = useContext(PageContext);
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
				<>
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
				</>
			}
			iconItems={({ iconColor }) => {
				if (pubData.canManage) {
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
