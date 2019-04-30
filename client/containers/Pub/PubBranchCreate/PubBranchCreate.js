import React from 'react';
import PropTypes from 'prop-types';
import { communityDataProps, locationDataProps, loginDataProps } from 'types/base';
import { pubDataProps } from 'types/pub';

const propTypes = {
	pubData: pubDataProps.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.func.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubBranchCreate = (props) => {
	return (
		<React.Fragment>
			<h1>Create Branch</h1>
		</React.Fragment>
	);
};

PubBranchCreate.propTypes = propTypes;
export default PubBranchCreate;
