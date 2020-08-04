import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Byline } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl, pubShortUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import { pubEdgeType } from './constants';
import { getHostnameForUrl } from './util';
import PubEdgeLayout from './PubEdgeLayout';
import PubEdgePlaceholderThumbnail from './PubEdgePlaceholderThumbnail';

require('./pubEdge.scss');

export const propTypes = {
	accentColor: PropTypes.string,
	actsLikeLink: PropTypes.bool,
	pubEdge: pubEdgeType.isRequired,
	viewingFromTarget: PropTypes.bool,
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
		const { title, description, attributions, avatar } = displayedPub;
		const url = getUrlForPub(displayedPub, communityData);
		const publishedDate = getPubPublishedDate(displayedPub);
		return {
			avatar: avatar,
			contributors: attributions || [],
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

const PubEdge = (props) => {
	const { accentColor, actsLikeLink, pubEdge, viewingFromTarget } = props;
	const [open, setOpen] = useState(false);
	const { communityData } = usePageContext();
	const hasExternalPublication = Boolean(pubEdge.externalPublication);
	const { avatar, contributors, description, publishedAt, title, url } = getValuesFromPubEdge(
		pubEdge,
		communityData,
		viewingFromTarget,
	);

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
			titleElement={maybeLink(title)}
			bylineElement={contributors.length > 0 && <Byline contributors={contributors} />}
			metadataElements={[
				description && (
					<span
						onClick={handleToggleDescriptionClick}
						onKeyDown={handleToggleDescriptionClick}
						tabIndex="0"
						className="link description-toggle"
						role="button"
						aria-controls={detailsElementId}
						aria-expanded={open}
					>
						{open ? 'Hide Description' : 'Show Description'}
					</span>
				),
				publishedAt && <>Published on {publishedAt}</>,
				<span className="location">{getHostnameForUrl(url)}</span>,
			]}
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

PubEdge.propTypes = propTypes;
PubEdge.defaultProps = defaultProps;
export default PubEdge;
