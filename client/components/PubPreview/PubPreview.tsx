import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

import { Pub, Community } from 'types';
import { getResizedUrl } from 'utils/images';
import { getPubPublishedDateString } from 'utils/pub/pubDates';
import { isPubPublic } from 'utils/pub/permissions';
import { getAllPubContributors } from 'utils/contributors';
import { communityUrl, bestPubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { Icon, PreviewImage, PubTitle } from 'components';

import ExpandButton from './ExpandButton';
import ManyAuthorsByline from './ManyAuthorsByline';
import PubPreviewEdges from './PubPreviewEdges';
import ContributorAvatars from '../ContributorAvatars/ContributorAvatars';

require('./pubPreview.scss');

type Props = {
	pubData: Pub;
	communityData?: any;
	size?: 'minimal' | 'small' | 'medium' | 'large';
	hideByline?: boolean;
	hideDescription?: boolean;
	hideDates?: boolean;
	hideContributors?: boolean;
	hideEdges?: boolean;
	customizePubUrl?: (url: string) => string;
};

const getPubUrl = (
	pubData: Pub,
	communityData: Community,
	customizePubUrl: Props['customizePubUrl'],
) => {
	const proposedPubUrl = bestPubUrl({ pubData, communityData });
	if (customizePubUrl) {
		return customizePubUrl(proposedPubUrl);
	}
	return proposedPubUrl;
};

const PubPreview = (props: Props) => {
	const {
		communityData,
		customizePubUrl,
		hideByline = false,
		hideContributors = false,
		hideDates = false,
		hideDescription = false,
		hideEdges = false,
		pubData,
		size = 'large',
	} = props;
	const { communityData: localCommunityData, scopeData, featureFlags } = usePageContext();
	const [isExpanded, setIsExpanded] = useState(false);
	const [canExpand, setCanExpand] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const resizedHeaderLogo =
		communityData && getResizedUrl(communityData.headerLogo, 'inside', 125, 35);
	const publishedDateString = getPubPublishedDateString(pubData);
	const isPrivate = !isPubPublic(pubData, scopeData);
	const showBannerImage = ['large', 'medium'].includes(size);
	const showUpperByline = !hideByline && ['minimal'].includes(size);
	const showLowerByline = !hideByline && ['large', 'medium', 'small'].includes(size);
	const showDates = !hideDates && ['large', 'medium', 'small'].includes(size);
	const showContributors = !hideContributors && ['large', 'medium', 'small'].includes(size);
	const showDescription = pubData.description && !hideDescription;
	const showExpandButton = canExpand && ['large', 'medium'].includes(size);
	const pubLink = getPubUrl(pubData, communityData || localCommunityData, customizePubUrl);

	const renderByline = () => (
		<ManyAuthorsByline
			truncateAt={8}
			pubData={pubData}
			linkToUsers={false}
			isExpanded={isExpanded}
		/>
	);

	useEffect(() => {
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
					<a href={pubLink} title={pubData.title}>
						<PreviewImage src={pubData.avatar} id={pubData.id} />
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
								title={communityData.title}
								className="community-banner"
								style={{ backgroundColor: communityData.accentColorDark }}
							>
								{resizedHeaderLogo ? (
									<img
										src={resizedHeaderLogo}
										alt={`in Community ${communityData.title}`}
									/>
								) : (
									<span style={{ color: communityData.accentColorLight }}>
										{communityData.title}
									</span>
								)}
							</a>
						)}
						<a href={pubLink} title={pubData.title}>
							<h3 className="pub-title">
								<PubTitle pubData={pubData} />
								{isPrivate && <Icon className="lock-icon" icon="lock2" />}
							</h3>
						</a>
					</div>

					{showLowerByline && <div className="authors">{renderByline()}</div>}

					{showContributors && (
						<ContributorAvatars
							attributions={getAllPubContributors(pubData, 'contributors')}
							truncateAt={6}
							className="contributor-avatars"
						/>
					)}

					{showDates && (
						<div className="date-details">
							{publishedDateString ? (
								<span className="date">Published: {publishedDateString}</span>
							) : (
								<span className="date">Unpublished</span>
							)}
						</div>
					)}

					{showDescription && (
						<div className="description">
							{featureFlags.htmlPubHeaderValues ? (
								<span
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={{
										__html:
											pubData.htmlDescription ?? pubData.description ?? '',
									}}
								/>
							) : (
								pubData.description
							)}
						</div>
					)}
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

export default PubPreview;
