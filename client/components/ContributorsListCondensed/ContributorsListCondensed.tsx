import React from 'react';

import PropTypes from 'prop-types';

import ContributorCondensed from './ContributorCondensed';

const propTypes = {
	attributions: PropTypes.array.isRequired,
};

const ContributorsListCondensed = function (props) {
	const { attributions } = props;
	return (
		<div className="contributors-list-condensed-component">
			{attributions.map((item) => {
				return <ContributorCondensed attribution={item} key={item.id} />;
			})}
		</div>
	);
};

ContributorsListCondensed.propTypes = propTypes;
export default ContributorsListCondensed;
