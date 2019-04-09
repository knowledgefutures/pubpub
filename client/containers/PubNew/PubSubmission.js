import React from 'react';
import PropTypes from 'prop-types';
import { communityDataProps, locationDataProps, loginDataProps } from 'utilities/sharedPropTypes';
import { pubDataProps } from './sharedPropTypes';

const propTypes = {
	pubData: pubDataProps.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.func.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubSubmission = (props) => {
	return (
		<React.Fragment>
			<h1>Submission</h1>
		</React.Fragment>
	);
};

PubSubmission.propTypes = propTypes;
export default PubSubmission;
