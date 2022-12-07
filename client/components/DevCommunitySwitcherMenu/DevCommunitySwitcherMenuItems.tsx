import React, { useCallback } from 'react';

import { MenuItem, MenuItemDivider } from 'components/Menu';
import { apiFetch } from 'client/utils/apiFetch';

import { communities } from './communities';

const setDevSubdomain = async (subdomain: null | string) => {
	await apiFetch.post('/api/dev', { subdomain });
	window.location.href = '/';
};

const DevCommunitySwitcherMenuItems = () => {
	const selectDevSubdomain = useCallback(() => {
		// eslint-disable-next-line no-alert
		const subdomain = prompt('Enter a Community subdomain');
		setDevSubdomain(subdomain);
	}, []);

	return (
		<>
			<MenuItem text="Base PubPub" icon="home" onClick={() => setDevSubdomain(null)} />
			<MenuItem
				text="Choose a Community..."
				icon="text-highlight"
				onClick={selectDevSubdomain}
			/>
			{communities.length > 0 && <MenuItemDivider />}
			{communities.map(({ title, subdomain, icon }) => (
				<MenuItem
					key={subdomain}
					text={title}
					icon={icon}
					onClick={() => setDevSubdomain(subdomain)}
				/>
			))}
		</>
	);
};

export default DevCommunitySwitcherMenuItems;
