import React from 'react';
import dateFormat from 'dateformat';

import { pubDataProps } from 'types/pub';
import { collectionUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate, getPubUpdatedDate, getPubCreatedDate } from 'utils/pub/pubDates';
import { ClickToCopyButton, ContributorsList } from 'components';
import { getAllPubContributors } from 'utils/contributors';
import { usePageContext } from 'utils/hooks';

import SmallHeaderButton from '../SmallHeaderButton';
import CitationsPreview from '../CitationsPreview';

require('./pubDetails.scss');

type Props = {
	pubData: pubDataProps;
	onCloseHeaderDetails: (...args: any[]) => any;
	communityData: {};
};

const PubDetails = (props: Props) => {
	const { communityData, onCloseHeaderDetails, pubData } = props;
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'collectionPubs' does not exist on type '... Remove this comment to see the full error message
	const { collectionPubs } = pubData;
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'pubDataProps' is not assignable ... Remove this comment to see the full error message
	const contributors = getAllPubContributors(pubData);
	const { scopeData } = usePageContext();
	const { canView } = scopeData.activePermissions;

	const createdAt = getPubCreatedDate(pubData);
	const publishedAt = getPubPublishedDate(pubData);
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'activeBranch' does not exist on type 'pu... Remove this comment to see the full error message
	const updatedAt = getPubUpdatedDate({ pub: pubData, branch: pubData.activeBranch });
	const shouldShowUpdatedDate = updatedAt && updatedAt !== publishedAt;

	return (
		<div className="pub-details-component">
			{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'pubDataPr... Remove this comment to see the full error message */}
			<h3 className="pub-title">{pubData.title}</h3>
			<SmallHeaderButton
				className="mobile-close-details-button"
				onClick={onCloseHeaderDetails}
				icon="cross"
			/>
			<div className="sections-wrapper">
				<div className="section contributors">
					<h6 className="pub-header-themed-secondary">
						Contributors ({contributors.length})
					</h6>
					<ContributorsList attributions={contributors} />
				</div>
				<div className="section publication-dates">
					{canView && (
						<React.Fragment>
							<h6 className="pub-header-themed-secondary">Created</h6>
							<div className="full-height-date">
								{dateFormat(createdAt, 'mmm dd, yyyy')}
							</div>
						</React.Fragment>
					)}
					<h6 className="pub-header-themed-secondary">Published</h6>
					<div className="full-height-date">
						{publishedAt ? dateFormat(publishedAt, 'mmm dd, yyyy') : <i>Unpublished</i>}
					</div>
					{shouldShowUpdatedDate && (
						<React.Fragment>
							<h6 className="pub-header-themed-secondary">Updated</h6>
							<div className="full-height-date">
								{dateFormat(updatedAt, 'mmm dd, yyyy')}
							</div>
						</React.Fragment>
					)}
				</div>
				<div className="section citation-and-doi">
					{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'doi' does not exist on type 'pubDataProp... Remove this comment to see the full error message */}
					{pubData.doi && (
						<React.Fragment>
							<h6 className="pub-header-themed-secondary">DOI</h6>{' '}
							{/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
							<ClickToCopyButton
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								copyString={`https://doi.org/${pubData.doi}`}
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								className="click-to-copy"
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								beforeCopyPrompt="Copy doi.org link"
							>
								{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'doi' does not exist on type 'pubDataProp... Remove this comment to see the full error message */}
								{pubData.doi}
							</ClickToCopyButton>
						</React.Fragment>
					)}
					<CitationsPreview pubData={pubData} />
				</div>
				<div className="section collections">
					<h6 className="pub-header-themed-secondary">
						Appears in Collections ({collectionPubs.length})
					</h6>
					<div className="collection-list">
						{collectionPubs.length === 0 && (
							<i className="collection-list-entry">
								This pub doesn't belong to any collections.
							</i>
						)}
						{collectionPubs.map((collectionPub) => {
							const { collection } = collectionPub;
							if (collection) {
								return (
									<a
										className="collection-list-entry hoverline"
										href={collectionUrl(communityData, collection)}
									>
										{collection.title}
									</a>
								);
							}
							return null;
						})}
					</div>
				</div>
			</div>
		</div>
	);
};
export default PubDetails;
