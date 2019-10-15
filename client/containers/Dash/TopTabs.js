import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getDashUrl } from './utils';
import AvatarBlock from './AvatarBlock';

require('./topTabs.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const TopTabs = (props) => {
	const { communityData, locationData } = props;

	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

	const activeCollection = communityData.collections.find(
		(collection) => collection.title.toLowerCase().replace(/ /gi, '-') === collectionSlug,
	);
	const activePub = communityData.pubs.find((pub) => pub.slug === pubSlug);

	const topTabs = [
		{
			title: 'Community',
			contentTitle: communityData.title,
			avatar: communityData.avatar,
			href: getDashUrl({}),
		},
		{
			title: collectionSlug ? 'Collection' : 'Pub',
			contentTitle: collectionSlug
				? activeCollection && activeCollection.title
				: activePub && activePub.title,
			avatar: !collectionSlug && activePub && activePub.avatar,
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: collectionSlug ? undefined : pubSlug,
			}),
		},
		{
			title: 'Pub',
			contentTitle: activePub && activePub.title,
			avatar: activePub && activePub.avatar,
			href: getDashUrl({ collectionSlug: collectionSlug, pubSlug: pubSlug }),
		},
	];

	return (
		<div className="top-tabs">
			{topTabs.map((tab, index) => {
				let active = 0;
				if ((collectionSlug && !pubSlug) || (!collectionSlug && pubSlug)) {
					active = 1;
				}
				if (collectionSlug && pubSlug) {
					active = 2;
				}

				const isActive = active === index;
				const useArrow = active > index && index !== 2;
				const rightBorder = active - index === 2;
				const roundRight = active - index === 1;
				const roundLeft = active - index === -1;
				const key = `${index}-null`;
				if (active < index) {
					return (
						<div
							key={key}
							className={classNames({
								tab: true,
								empty: true,
								right: rightBorder,
								arrow: useArrow,
								active: isActive,
								roundRight: roundRight,
								roundLeft: roundLeft,
							})}
						/>
					);
				}
				return (
					<a
						key={tab.title}
						// href={href}
						href={tab.href}
						className={classNames({
							tab: true,
							right: rightBorder,
							arrow: useArrow,
							active: isActive,
							roundRight: roundRight,
							roundLeft: roundLeft,
						})}
					>
						<div className="title">{tab.title}</div>
						<AvatarBlock
							avatar={tab.avatar}
							title={tab.contentTitle}
							communityData={communityData}
							width={25}
						/>
					</a>
				);
			})}
		</div>
	);
};

TopTabs.propTypes = propTypes;
export default TopTabs;
