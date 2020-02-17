import React from 'react';
import { Avatar, Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl, getDashboardModes } from 'utils/dashboard';

require('./breadcrumbs.scss');

const Breadcrumbs = () => {
	const { locationData, communityData, scopeData } = usePageContext();
	const { activePub, activeCollection } = scopeData.elements;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const { mode, subMode } = getDashboardModes(locationData);
	// console.log(locationData.path.split('/'), locationData.path.split('/').slice(-1))
	// const modesWithSubmodes = ['discussions', 'reviews', 'pages'];
	// const isParentMode = modesWithSubmodes.includes(activeMode);

	let title = communityData.title;
	let avatar = communityData.avatar;
	if (activeCollection) {
		title = activeCollection.title;
		avatar = activeCollection.avatar;
	}
	if (activePub) {
		title = activePub.title;
		avatar = activePub.avatar;
	}

	return (
		<div className="breadcrumbs-component">
			<Avatar
				avatar={avatar}
				initials={title[0]}
				communityData={communityData}
				width={40}
				isBlock={true}
			/>
			<div className="titles">
				<div className="title">{title}</div>

				<div className="crumbs">
					<a className="crumb truncate" href={getDashUrl({})}>
						<Icon icon="office" iconSize={10} />
						<span className="bottom-text">{communityData.title}</span>
					</a>
					{activeCollection && (
						<React.Fragment>
							<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
							<a
								className="crumb truncate"
								href={getDashUrl({ collectionSlug: collectionSlug })}
							>
								<Icon icon="collection" iconSize={10} />
								<span className="bottom-text">{activeCollection.title}</span>
							</a>
						</React.Fragment>
					)}

					{activePub && (
						<React.Fragment>
							<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
							<a
								className="crumb truncate"
								href={getDashUrl({
									collectionSlug: collectionSlug,
									pubSlug: pubSlug,
								})}
							>
								<Icon icon="pubDoc" iconSize={10} />
								<span className="bottom-text">{activePub.title}</span>
							</a>
						</React.Fragment>
					)}
					{mode && (
						<React.Fragment>
							<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
							<a
								className="crumb"
								href={getDashUrl({
									collectionSlug: collectionSlug,
									pubSlug: pubSlug,
									mode: mode,
									// submode: isParentMode ? 'list' : undefined,
								})}
							>
								<div className="top" />
								<div className="bottom capitalize">{mode}</div>
							</a>
						</React.Fragment>
					)}
					{subMode && (
						<React.Fragment>
							<Icon icon="chevron-right" className="crumb-icon" iconSize={12} />
							<a
								className="crumb"
								href={getDashUrl({
									collectionSlug: collectionSlug,
									pubSlug: pubSlug,
									mode: mode,
									submode: subMode,
								})}
							>
								<div className="capitalize">{subMode}</div>
							</a>
						</React.Fragment>
					)}
				</div>
			</div>
		</div>
	);
};

export default Breadcrumbs;
