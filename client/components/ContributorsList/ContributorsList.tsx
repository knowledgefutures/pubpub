import React from 'react';
import PropTypes from 'prop-types';
import Contributor from './Contributor';

const propTypes = {
	attributions: PropTypes.array.isRequired,
};

const ContributorsList = function(props) {
	const { attributions } = props;
	return (
		<div className="contributors-list-component">
			{attributions.map((item) => {
				return <Contributor attribution={item} key={item.id} />;
			})}
		</div>
	);
};

ContributorsList.propTypes = propTypes;
export default ContributorsList;
