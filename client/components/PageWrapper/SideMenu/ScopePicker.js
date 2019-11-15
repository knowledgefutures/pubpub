import React from 'react';
import PropTypes from 'prop-types';
import { getDashUrl } from 'utils/dashboard';
import { Avatar, Icon, MenuButton, MenuItem } from 'components';

require('./scopePicker.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const ScopePicker = (props) => {
	const { communityData, locationData } = props;

	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;

	const activeCollection = communityData.collections.find(
		(collection) => collection.title.toLowerCase().replace(/ /gi, '-') === collectionSlug,
	);
	const activePub = communityData.pubs.find((pub) => pub.slug === pubSlug);

	let currentScopeTitle = 'Community';
	let icon = 'office';
	if (activeCollection) {
		currentScopeTitle = 'Collection';
		icon = 'collection';
	}
	if (activePub) {
		currentScopeTitle = 'Pub';
		icon = 'pubDoc';
	}

	const scopes = [];
	scopes.push({
		type: 'Community',
		icon: 'office',
		title: communityData.title,
		avatar: communityData.avatar,
		href: getDashUrl({}),
	});
	if (activeCollection) {
		scopes.push({
			type: 'Collection',
			icon: 'collection',
			title: activeCollection.title,
			avatar: activeCollection.avatar,
			href: getDashUrl({
				collectionSlug: collectionSlug,
			}),
		});
	}
	if (activePub) {
		scopes.push({
			type: 'Pub',
			icon: 'pubDoc',
			title: activePub.title,
			avatar: activePub.avatar,
			href: getDashUrl({
				collectionSlug: collectionSlug,
				pubSlug: pubSlug,
			}),
		});
	}

	return (
		<div className="scope-picker-component">
			<MenuButton
				buttonContent={
					<React.Fragment>
						<div className="top">{currentScopeTitle}</div>
						<div className="bottom">Dashboard</div>
					</React.Fragment>
				}
				buttonProps={{
					icon: <Icon icon={icon} />,
					className: 'scope-button',
					fill: true,
					minimal: true,
					rightIcon: 'caret-down',
				}}
				placement="top-start"
				className="scope-menu"
			>
				<React.Fragment>
					<div className="intro">Select Dashbord to view:</div>
					<div className="scopes">
						{scopes.map((scope, index) => {
							return (
								<MenuItem
									href={scope.href}
									text={
										<div className={`scope-item item-${index}`}>
											<div className="top">
												<Icon icon={scope.icon} iconSize={10} />
												{scope.type}
											</div>
											<div className="bottom">
												<Avatar
													avatar={scope.avatar}
													initials={scope.title[0]}
													communityData={communityData}
													width={18}
													isBlock={true}
												/>
												{scope.title}
											</div>
										</div>
									}
								/>
							);
						})}
					</div>
				</React.Fragment>
			</MenuButton>
		</div>
	);
};

ScopePicker.propTypes = propTypes;
export default ScopePicker;
