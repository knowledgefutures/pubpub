import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reakit/Button';

import { Byline } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl, pubShortUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import { pubEdgeType } from './constants';

require('./pubEdge.scss');

export const propTypes = {
	pubEdge: pubEdgeType.isRequired,
	viewingFromTarget: PropTypes.bool.isRequired,
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
		return {
			contributors: attributions,
			title: title,
			description: description,
			avatar: avatar,
			publicationDate: getPubPublishedDate(displayedPub),
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
			title: title,
			description: description,
			contributors: contributors,
			avatar: avatar,
			url: url,
			publicationDate: publicationDate,
		};
	}
	return {};
};

const PubEdge = (props) => {
	const { pubEdge, viewingFromTarget } = props;
	const [open, setOpen] = useState(false);
	const { communityData } = usePageContext();

	const { avatar, contributors, description, publicationDate, title, url } = getValuesFromPubEdge(
		pubEdge,
		communityData,
		viewingFromTarget,
	);

	const publishedAt = formatDate(publicationDate);

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

	return (
		<article className="pub-edge-component">
			<div className="top">
				{avatar && (
					<div className="top-left">
						<img src={avatar} alt="" />
					</div>
				)}
				<div className="top-right">
					<h4>{title}</h4>
					<Byline contributors={contributors} />
					<ul className="metadata">
						{description && (
							<li>
								<Button
									as="a"
									onClick={handleToggleDescriptionClick}
									onKeyDown={handleToggleDescriptionClick}
									tabIndex="0"
								>
									{open ? 'Hide Description' : 'Show Description'}
								</Button>
							</li>
						)}
						<li>Published on {publishedAt}</li>
						<li>
							<a href={url} alt={title} tabIndex="0">
								{url}
							</a>
						</li>
					</ul>
				</div>
			</div>
			<details open={open}>
				<summary>Description</summary>
				<hr />
				<p>{description}</p>
			</details>
		</article>
	);
};

PubEdge.propTypes = propTypes;
export default PubEdge;
