import React from 'react';
import { LocationData } from 'types';

import GlobalControlsButton from './GlobalControlsButton';

type Props = {
	locationData: LocationData;
};

const LoginButton = (props: Props) => {
	const { locationData } = props;
	const { path, queryString } = locationData;
	if (['/login', '/signup'].includes(path)) {
		return null;
	}
	const redirectString = `?redirect=${path}${queryString.length > 1 ? queryString : ''}`;
	const loginHref = `/login${redirectString}`;
	return (
		<GlobalControlsButton
			href={loginHref}
			desktop={{ text: 'Login or Signup' }}
			mobile={{ text: 'Login' }}
		/>
	);
};

export default LoginButton;
