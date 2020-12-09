import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import { Byline } from 'components';
import { usePageContext } from 'utils/hooks';
import { getHostnameForUrl, getValuesFromPubEdge } from 'utils/pubEdge';

import PubEdgeLayout from './PubEdgeLayout';
import PubEdgeDescriptionButton from './PubEdgeDescriptionButton';

require('./pubEdge.scss');

export type PubEdgeProps = {
	accentColor?: string;
	actsLikeLink?: boolean;
	pubEdge: any;
	viewingFromTarget?: boolean;
	showDescriptionByDefault?: boolean;
};

const PubEdge = (props: PubEdgeProps) => {
	const {
		actsLikeLink = false,
		pubEdge,
		viewingFromTarget = false,
		showDescriptionByDefault = false,
	} = props;
	const [open, setOpen] = useState(showDescriptionByDefault);
	const { communityData } = usePageContext();
	const { avatar, contributors, description, publishedAt, title, url } = getValuesFromPubEdge(
		pubEdge,
		communityData,
		viewingFromTarget,
	);

	const detailsElementId = `edge-details-${pubEdge.id}`;

	const handleToggleDescriptionClick = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			if (e.type === 'click' || ('key' in e && e.key === 'Enter')) {
				e.preventDefault();
				e.stopPropagation();
				setOpen(!open);
			}
		},
		[open],
	);

	const maybeLink = (element, restProps = {}) => {
		if (!element) {
			return null;
		}

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

	useEffect(() => setOpen(showDescriptionByDefault), [showDescriptionByDefault]);

	return maybeWrapWithLink(
		<PubEdgeLayout
			topLeftElement={maybeLink(avatar && <img src={avatar} alt={title} />, {
				tabIndex: '-1',
			})}
			titleElement={maybeLink(title)}
			bylineElement={
				contributors && contributors.length > 0 && <Byline contributors={contributors} />
			}
			metadataElements={[
				description && (
					<PubEdgeDescriptionButton
						onToggle={handleToggleDescriptionClick}
						open={open}
						targetId={detailsElementId}
					/>
				),
				publishedAt && <>Published on {publishedAt}</>,
				url && <span className="location">{getHostnameForUrl(url)}</span>,
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

export default PubEdge;
