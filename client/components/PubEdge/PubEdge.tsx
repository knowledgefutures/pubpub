import React, { useCallback, useState } from 'react';
import classNames from 'classnames';

import { Byline } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl, pubShortUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { getAllPubContributors } from 'utils/contributors';

import { pubEdgeType } from './constants';
import { getHostnameForUrl } from './util';
import PubEdgeLayout from './PubEdgeLayout';
import PubEdgePlaceholderThumbnail from './PubEdgePlaceholderThumbnail';

require('./pubEdge.scss');

type OwnProps = {
	accentColor?: string;
	actsLikeLink?: boolean;
	pubEdge: pubEdgeType;
	viewingFromTarget?: boolean;
};

const defaultProps = {
	accentColor: '#ddd',
	actsLikeLink: false,
	viewingFromTarget: false,
};

const getUrlForPub = (pubData, communityData) => {
	if (communityData.id === pubData.communityId) {
		return pubUrl(communityData, pubData);
	}
	if (pubData.community) {
		return pubUrl(pubData.communityId, pubData);
	}
	return pubShortUrl(pubData);
};

const getValuesFromPubEdge = (pubEdge, communityData, viewingFromTarget) => {
	const { externalPublication, targetPub, pub } = pubEdge;
	const displayedPub = viewingFromTarget ? pub : targetPub;
	if (displayedPub) {
		const { title, description, avatar } = displayedPub;
		const url = getUrlForPub(displayedPub, communityData);
		const publishedDate = getPubPublishedDate(displayedPub);
		return {
			avatar: avatar,
			contributors: getAllPubContributors(displayedPub, false, true),
			description: description,
			publishedAt: publishedDate && formatDate(publishedDate),
			title: title,
			url: url,
		};
	}
	if (externalPublication) {
		const {
			title,
			description,
			contributors,
			avatar,
			url,
			publicationDate,
		} = externalPublication;
		return {
			avatar: avatar,
			contributors: contributors || '',
			description: description,
			publishedAt: publicationDate && formatDate(publicationDate, { inUtcTime: true }),
			title: title,
			url: url,
		};
	}
	return {};
};

type Props = OwnProps & typeof defaultProps;

const PubEdge = (props: Props) => {
	const { accentColor, actsLikeLink, pubEdge, viewingFromTarget } = props;
	const [open, setOpen] = useState(false);
	const { communityData } = usePageContext();
	const hasExternalPublication = Boolean(pubEdge.externalPublication);
	const { avatar, contributors, description, publishedAt, title, url } = getValuesFromPubEdge(
		pubEdge,
		communityData,
		viewingFromTarget,
	);

	// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'pubEdgeType'... Remove this comment to see the full error message
	const detailsElementId = `edge-details-${pubEdge.id}`;

	const handleToggleDescriptionClick = useCallback(
		(e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				setOpen(!open);
			}
		},
		[open],
	);

	const maybeLink = (element, restProps = {}) => {
		if (actsLikeLink) {
			return (
				<span className="link" {...restProps}>
					{element}
				</span>
			);
		}

		return (
			<a href={url} {...restProps}>
				{element}
			</a>
		);
	};

	const maybeWrapWithLink = (element, restProps = {}) => {
		if (actsLikeLink) {
			return (
				<a href={url} {...restProps}>
					{element}
				</a>
			);
		}
		return <div {...restProps}>{element}</div>;
	};

	return maybeWrapWithLink(
		<PubEdgeLayout
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			topLeftElement={maybeLink(
				avatar ? (
					<img src={avatar} alt={title} />
				) : (
					<PubEdgePlaceholderThumbnail
						color={accentColor}
						external={hasExternalPublication}
					/>
				),
				{ tabIndex: '-1' },
			)}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			titleElement={maybeLink(title)}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'never'.
			bylineElement={contributors.length > 0 && <Byline contributors={contributors} />}
			metadataElements={[
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				description && (
					<span
						onClick={handleToggleDescriptionClick}
						onKeyDown={handleToggleDescriptionClick}
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
						tabIndex="0"
						className="link description-toggle"
						role="button"
						aria-controls={detailsElementId}
						aria-expanded={open}
					>
						{open ? 'Hide Description' : 'Show Description'}
					</span>
				),
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'never'... Remove this comment to see the full error message
				publishedAt && <>Published on {publishedAt}</>,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				<span className="location">{getHostnameForUrl(url)}</span>,
			]}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			detailsElement={
				<details open={open} id={detailsElementId}>
					<summary>Description</summary>
					<hr />
					<p>{description}</p>
				</details>
			}
		/>,
		{ className: classNames('pub-edge-component', actsLikeLink && 'acts-like-link') },
	);
};
PubEdge.defaultProps = defaultProps;
export default PubEdge;
