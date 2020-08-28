import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import dateFormat from 'dateformat';

import { getResizedUrl } from 'utils/images';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { isPubPublic } from 'utils/pub/permissions';
import { getAllPubContributors } from 'utils/pub/contributors';
import { communityUrl, bestPubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { Avatar, Icon, PreviewImage } from 'components';

import ExpandButton from './ExpandButton';
import ManyAuthorsByline from './ManyAuthorsByline';
import PubPreviewEdges from './PubPreviewEdges';

require('./pubPreview.scss');

type OwnProps = {
	pubData: {
		attributions?: any[];
		avatar?: string;
		description?: string;
		edges?: any[];
		slug?: any; // TODO: PropTypes.slug
		title?: string;
	};
	communityData?: any;
	size?: string;
	hideByline?: boolean;
	hideDescription?: boolean;
	hideDates?: boolean;
	hideContributors?: boolean;
	hideEdges?: boolean;
	customPubUrl?: string;
};

const defaultProps = {
	communityData: undefined,
	size: 'large',
	hideByline: false,
	hideDescription: false,
	hideDates: false,
	hideContributors: false,
	hideEdges: false,
	customPubUrl: null,
};

type Props = OwnProps & typeof defaultProps;

const PubPreview = (props: Props) => {
	const {
		communityData,
		customPubUrl,
		hideByline,
		hideContributors,
		hideDates,
		hideDescription,
		hideEdges,
		pubData,
		size,
	} = props;
	const { communityData: localCommunityData, scopeData } = usePageContext();
	const [isExpanded, setIsExpanded] = useState(false);
	const [canExpand, setCanExpand] = useState(false);
	const contentRef = useRef(null);
	const resizedHeaderLogo =
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'headerLogo' does not exist on type 'neve... Remove this comment to see the full error message
		communityData && getResizedUrl(communityData.headerLogo, 'fit-in', '125x35');
	const publishedDate = getPubPublishedDate(pubData);
	const isPrivate = !isPubPublic(pubData, scopeData);
	const showBannerImage = ['large', 'medium'].includes(size);
	const showUpperByline = !hideByline && ['minimal'].includes(size);
	const showLowerByline = !hideByline && ['large', 'medium', 'small'].includes(size);
	const showDates = !hideDates && ['large', 'medium', 'small'].includes(size);
	const showContributors = !hideContributors && ['large', 'medium', 'small'].includes(size);
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'description' does not exist on type 'nev... Remove this comment to see the full error message
	const showDescription = pubData.description && !hideDescription;
	const showExpandButton = canExpand && ['large', 'medium'].includes(size);
	const pubLink =
		customPubUrl ||
		bestPubUrl({ pubData: pubData, communityData: communityData || localCommunityData });

	const renderByline = () => (
		<ManyAuthorsByline
			truncateAt={8}
			pubData={pubData}
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'linkToUsers' does not exist on type 'Int... Remove this comment to see the full error message
			linkToUsers={false}
			isExpanded={isExpanded}
		/>
	);

	useEffect(() => {
		const { current: contentEl } = contentRef;
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		if (contentEl && contentEl.scrollHeight - contentEl.clientHeight > 0) {
			setCanExpand(true);
		}
	}, []);

	return (
		<div
			className={classNames(
				'pub-preview-component',
				`${size}-preview`,
				isExpanded && 'expanded',
			)}
		>
			<div className="preview-image-wrapper">
				{showBannerImage && (
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'alt' does not exist on type 'DetailedHTM... Remove this comment to see the full error message
					<a href={pubLink} alt={pubData.title}>
						{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'. */}
						<PreviewImage src={pubData.avatar} title={pubData.title} />
					</a>
				)}
			</div>
			<div className="content-wrapper">
				<div className="content" ref={contentRef}>
					{showUpperByline && (
						<div
							className="authors"
							style={{ color: localCommunityData.accentColorDark }}
						>
							{renderByline()}
						</div>
					)}
					<div className="title-wrapper">
						{communityData && (
							<a
								href={communityUrl(communityData)}
								// @ts-expect-error ts-migrate(2322) FIXME: Property 'alt' does not exist on type 'DetailedHTM... Remove this comment to see the full error message
								alt={communityData.title}
								className="community-banner"
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'accentColorDark' does not exist on type ... Remove this comment to see the full error message
								style={{ backgroundColor: communityData.accentColorDark }}
							>
								{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'. */}
								<img alt={`${communityData.title} logo`} src={resizedHeaderLogo} />
							</a>
						)}
						{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'alt' does not exist on type 'DetailedHTM... Remove this comment to see the full error message */}
						<a href={pubLink} alt={pubData.title}>
							<h3 className="pub-title">
								{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'. */}
								{pubData.title}
								{isPrivate && <Icon className="lock-icon" icon="lock2" />}
							</h3>
						</a>
					</div>

					{showLowerByline && <div className="authors">{renderByline()}</div>}

					{showContributors && (
						<div className="author-avatars">
							{getAllPubContributors(pubData).map((contributor, index) => {
								return (
									<Avatar
										key={`avatar-${contributor.id}`}
										instanceNumber={index}
										initials={contributor.user.initials}
										avatar={contributor.user.avatar}
										borderColor="rgba(255, 255, 255, 1.0)"
										width={20}
										doesOverlap={true}
									/>
								);
							})}
						</div>
					)}

					{showDates && (
						<div className="date-details">
							{publishedDate ? (
								<span className="date">
									Published: {dateFormat(publishedDate, 'mmm dd, yyyy')}
								</span>
							) : (
								<span className="date">Unpublished</span>
							)}
						</div>
					)}

					{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'description' does not exist on type 'nev... Remove this comment to see the full error message */}
					{showDescription && <div className="description">{pubData.description}</div>}
					{!hideEdges && (
						<PubPreviewEdges
							pubData={pubData}
							accentColor={localCommunityData.accentColorDark}
						/>
					)}
				</div>
				{showExpandButton && (
					<ExpandButton
						accentColor={localCommunityData.accentColorDark}
						isExpanded={isExpanded}
						onClick={() => setIsExpanded(!isExpanded)}
					/>
				)}
			</div>
		</div>
	);
};

PubPreview.defaultProps = defaultProps;
export default PubPreview;
