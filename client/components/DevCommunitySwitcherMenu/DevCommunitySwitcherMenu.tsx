import React from 'react';

import { Menu } from 'components/Menu';

import DevCommunitySwitcherMenuItems from './DevCommunitySwitcherMenuItems';

type Props = Omit<React.ComponentProps<typeof Menu>, 'children' | 'aria-label'>;

const DevCommunitySwitcherMenu = (props: Props) => {
	return (
		<Menu {...props} aria-label="Switch Community">
			<DevCommunitySwitcherMenuItems />
		</Menu>
	);
};

export default DevCommunitySwitcherMenu;
