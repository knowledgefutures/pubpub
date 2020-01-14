import React from 'react';
import { NonIdealState } from '@blueprintjs/core';
import { usePageContext } from 'utils/hooks';

require('./noMatch.scss');

const NoMatch = () => {
	const { locationData, loginData } = usePageContext();
	const redirectString = `?redirect=${locationData.path}${
		locationData.queryString.length > 1 ? locationData.queryString : ''
	}`;

	return (
		<div id="no-match-container">
			<NonIdealState
				title="Page Not Found"
				visual="path-search"
				description={
					loginData.id
						? null // TODO: eventually, put text suggesting a search
						: 'If you believe there should be a page at this URL, it may be private. Try logging in.'
				}
				action={
					loginData.id ? null : ( // TODO: eventually, put a search box here.
						<a
							href={`/login${redirectString}`}
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Login
						</a>
					)
				}
			/>
		</div>
	);
};

export default NoMatch;
