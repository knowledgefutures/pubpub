import React, { useState, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
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

const propTypes = {
	pubData: PropTypes.shape({
		attributions: PropTypes.array,
		avatar: PropTypes.string,
		description: PropTypes.string,
		edges: PropTypes.array,
		slug: PropTypes.slug,
		title: PropTypes.string,
	}).isRequired,
	communityData: PropTypes.object,
	size: PropTypes.string,
	hideByline: PropTypes.bool,
	hideDescription: PropTypes.bool,
	hideDates: PropTypes.bool,
	hideContributors: PropTypes.bool,
	hideEdges: PropTypes.bool,
	customPubUrl: PropTypes.string,
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

const PubPreview = (props) => {
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
		communityData && getResizedUrl(communityData.headerLogo, 'fit-in', '125x35');
	const publishedDate = getPubPublishedDate(pubData);
	const isPrivate = !isPubPublic(pubData, scopeData);
	const showBannerImage = ['large', 'medium'].includes(size);
	const showUpperByline = !hideByline && ['minimal'].includes(size);
	const showLowerByline = !hideByline && ['large', 'medium', 'small'].includes(size);
	const showDates = !hideDates && ['large', 'medium', 'small'].includes(size);
	const showContributors = !hideContributors && ['large', 'medium', 'small'].includes(size);
	const showDescription = pubData.description && !hideDescription;
	const showExpandButton = canExpand && ['large', 'medium'].includes(size);
	const pubLink =
		customPubUrl || bestPubUrl({ pubData: pubData, communityData: localCommunityData });

	const renderByline = () => (
		<ManyAuthorsByline
			truncateAt={8}
			pubData={pubData}
			linkToUsers={false}
			isExpanded={isExpanded}
		/>
	);

	useLayoutEffect(() => {
		const { current: contentEl } = contentRef;
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
					<a href={pubLink} alt={pubData.title}>
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
								alt={communityData.title}
								className="community-banner"
								style={{ backgroundColor: communityData.accentColorDark }}
							>
								<img alt={`${communityData.title} logo`} src={resizedHeaderLogo} />
							</a>
						)}
						<a href={pubLink} alt={pubData.title}>
							<h3 className="pub-title">
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
PubPreview.propTypes = propTypes;
export default PubPreview;
