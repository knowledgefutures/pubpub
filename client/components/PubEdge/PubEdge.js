import React, { useCallback, useState } from 'react';
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
};

const getValuesFromPubEdge = (pubEdge, communityData) => {
	const { externalPublication, targetPub } = pubEdge;
	if (targetPub) {
		const { title, description, attributions, avatar } = targetPub;
		const url =
			communityData.id === targetPub.communityId
				? pubUrl(communityData, targetPub)
				: pubShortUrl(targetPub);
		return {
			contributors: attributions,
			title: title,
			description: description,
			avatar: avatar,
			publicationDate: getPubPublishedDate(targetPub),
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
	const { pubEdge } = props;
	const [open, setOpen] = useState(false);
	const { communityData } = usePageContext();

	const handleToggleDescriptionClick = useCallback(
		(e) => {
			e.preventDefault();
			setOpen(!open);
		},
		[open],
	);

	const { avatar, contributors, description, publicationDate, title, url } = getValuesFromPubEdge(
		pubEdge,
		communityData,
	);

	const publishedAt = formatDate(publicationDate);

	return (
		<a className="pub-edge-component" href={url}>
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
						<li>
							<Button as="a" onClick={handleToggleDescriptionClick}>
								{open ? 'Hide Description' : 'Show Description'}
							</Button>
						</li>
						<li>Published on {publishedAt}</li>
						<li>
							<a href={url} alt={url}>
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
		</a>
	);
};

PubEdge.propTypes = propTypes;
export default PubEdge;
