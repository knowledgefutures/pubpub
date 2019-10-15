import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'components';
import { getDashUrl } from './utils';
import AvatarBlock from './AvatarBlock';

require('./breadcrumbs.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Breadcrumbs = (props) => {
	const { communityData, locationData } = props;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

	const activeCollection = communityData.collections.find(
		(collection) => collection.title.toLowerCase().replace(/ /gi, '-') === collectionSlug,
	);
	const activePub = communityData.pubs.find((pub) => pub.slug === pubSlug);
	const activeMode = locationData.params.mode || 'Overview';
	const isParentMode = activeMode === 'conversations' || activeMode === 'reviews';
	const activeSubmode = locationData.params.submode;

	return (
		<div className="breadcrumbs-component">
			<a className="crumb truncate" href={getDashUrl({})}>
				<div className="top">Community</div>
				<div className="bottom">
					<AvatarBlock
						avatar={communityData.avatar}
						title={communityData.title}
						communityData={communityData}
						width={12}
					/>
					<span className="bottom-text">{communityData.title}</span>
				</div>
			</a>
			{activeCollection && (
				<React.Fragment>
					<Icon icon="chevron-right" className="crumb-icon" />
					<a
						className="crumb truncate"
						href={getDashUrl({ collectionSlug: collectionSlug })}
					>
						<div className="top">Collection</div>
						<div className="bottom">
							<AvatarBlock
								avatar={activeCollection.avatar}
								title={activeCollection.title}
								communityData={communityData}
								width={12}
							/>
							<span className="bottom-text">{activeCollection.title}</span>
						</div>
					</a>
				</React.Fragment>
			)}

			{activePub && (
				<React.Fragment>
					<Icon icon="chevron-right" className="crumb-icon" />
					<a
						className="crumb truncate"
						href={getDashUrl({ collectionSlug: collectionSlug, pubSlug: pubSlug })}
					>
						<div className="top">Pub</div>
						<div className="bottom">
							<AvatarBlock
								avatar={activePub.avatar}
								title={activePub.title}
								communityData={communityData}
								width={12}
							/>
							<span className="bottom-text">{activePub.title}</span>
						</div>
					</a>
				</React.Fragment>
			)}
			{activeMode && (
				<React.Fragment>
					<Icon icon="chevron-right" className="crumb-icon" />
					<a
						className="crumb"
						href={getDashUrl({
							collectionSlug: collectionSlug,
							pubSlug: pubSlug,
							mode: activeMode,
							submode: isParentMode ? 'list' : undefined,
						})}
					>
						<div className="top" />
						<div className="bottom capitalize">{activeMode}</div>
					</a>
				</React.Fragment>
			)}
			{activeSubmode && (
				<React.Fragment>
					<Icon icon="chevron-right" className="crumb-icon" />
					<a
						className="crumb"
						href={getDashUrl({
							collectionSlug: collectionSlug,
							pubSlug: pubSlug,
							mode: activeMode,
							submode: activeSubmode,
						})}
					>
						<div className="top" />
						<div className="bottom capitalize">{activeSubmode}</div>
					</a>
				</React.Fragment>
			)}
		</div>
	);
};

Breadcrumbs.propTypes = propTypes;
export default Breadcrumbs;
