import React from 'react';

import { AnchorButton, Card } from '@blueprintjs/core';

type Props = {
	userEmail: string;
	accountUrl: string;
};

const AccountSecuritySettings = ({ userEmail, accountUrl }: Props) => {
	return (
		<Card>
			<h5 id="account-security">Email &amp; password</h5>
			<p>
				Your email address is <strong>{userEmail}</strong>. Your login details, including
				your email address and password, are managed through your Knowledge Futures (KF)
				account.
			</p>
			<AnchorButton
				href={accountUrl}
				intent="primary"
				rightIcon="share"
				text="Manage your Knowledge Futures account"
			/>
		</Card>
	);
};

export default AccountSecuritySettings;
