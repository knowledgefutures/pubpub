import React from 'react';
import { usePageContext } from 'utils/hooks';
import { Icon, IconName, MenuButton, ScopeDropdown } from 'components';

require('./scopePicker.scss');

type Props = {
	isMobile?: boolean;
};

const ScopePicker = (props: Props) => {
	const { isMobile } = props;
	const { scopeData } = usePageContext();
	const { activeCollection, activePub } = scopeData.elements;

	let currentScopeTitle = 'Community';
	let icon: IconName = 'office';
	if (activeCollection) {
		currentScopeTitle = 'Collection';
		icon = 'collection';
	}
	if (activePub) {
		currentScopeTitle = 'Pub';
		icon = 'pubDoc';
	}

	return (
		<div className="scope-picker-component">
			<MenuButton
				aria-label={!isMobile ? 'Dashboard Menu' : 'Mobile Dash Menu'}
				buttonContent={
					<React.Fragment>
						<div className="top">{currentScopeTitle}</div>
						{!isMobile && <div className="bottom">Dashboard</div>}
					</React.Fragment>
				}
				buttonProps={{
					icon: <Icon icon={icon} />,
					className: 'scope-button',
					fill: true,
					minimal: true,
					rightIcon: 'caret-down',
				}}
				placement={isMobile ? 'top-start' : 'bottom-start'}
				className="scope-picker-menu"
			>
				<ScopeDropdown isDashboard />
			</MenuButton>
		</div>
	);
};

export default ScopePicker;
