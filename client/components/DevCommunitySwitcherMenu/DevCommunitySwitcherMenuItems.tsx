import React, { useCallback } from 'react';

import { Button, Classes, Dialog, InputGroup } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { MenuItem, MenuItemDivider } from 'components/Menu';

import DialogLauncher from '../DialogLauncher/DialogLauncher';
import { communities } from './communities';

const setDevSubdomain = async (subdomain: null | string) => {
	await apiFetch.post('/api/dev', { subdomain });
	window.location.href = '/';
};

const DevCommunitySwitcherMenuItems = () => {
	const selectDevSubdomain = useCallback((evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		const formData = new FormData(evt.currentTarget);
		const subdomain = formData.get('subdomain') as string;
		// const subdomain = prompt('Enter a Community subdomain');
		setDevSubdomain(subdomain);
	}, []);

	return (
		<>
			<MenuItem text="Base PubPub" icon="home" onClick={() => setDevSubdomain(null)} />
			<DialogLauncher
				renderLauncherElement={({ openDialog }) => (
					<MenuItem
						text="Choose a Community..."
						icon="text-highlight"
						onClick={openDialog}
					/>
				)}
			>
				{({ isOpen, onClose }) => (
					<>
						<Dialog isOpen={isOpen} onClose={onClose} title="Choose a Community...">
							<div className={Classes.DIALOG_BODY}>
								<p>Enter a Community subdomain</p>
								<form onSubmit={selectDevSubdomain}>
									<InputGroup name="subdomain" />
									{/** biome-ignore lint/correctness/noUndeclaredVariables: <explanation> */}
									<Button type="submit">Select</Button>
								</form>
							</div>
						</Dialog>
					</>
				)}
			</DialogLauncher>
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
