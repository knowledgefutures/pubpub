import React from 'react';
import PropTypes from 'prop-types';
import { NonIdealState } from '@blueprintjs/core';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utilities';

require('./noMatch.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const NoMatch = (props) => {
	const redirectString = `?redirect=${props.locationData.path}${
		props.locationData.queryString.length > 1 ? props.locationData.queryString : ''
	}`;
	return (
		<div id="no-match-container">
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
				hideFooter={true}
				hideNav={props.locationData.isBasePubPub}
			>
				<NonIdealState
					title="Page Not Found"
					visual="path-search"
					description={
						props.loginData.id
							? null // TODO: eventually, put text suggesting a search
							: 'If you believe there should be a page at this URL, it may be private. Try logging in.'
					}
					action={
						props.loginData.id ? null : ( // TODO: eventually, put a search box here.
							<a
								href={`/login${redirectString}`}
								className="bp3-button bp3-large bp3-intent-primary"
							>
								Login
							</a>
						)
					}
				/>
			</PageWrapper>
		</div>
	);
};

NoMatch.propTypes = propTypes;
export default NoMatch;

hydrateWrapper(NoMatch);
