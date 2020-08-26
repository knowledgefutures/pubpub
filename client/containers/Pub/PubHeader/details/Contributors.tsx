import React from 'react';
import PropTypes from 'prop-types';
import Contributor from './Contributor';

const propTypes = {
	contributors: PropTypes.array.isRequired,
};

const Contributors = function(props) {
	const { contributors } = props;
	return (
		<div className="pub-contributors-component">
			{contributors.map((item) => {
				return <Contributor attribution={item} key={item.id} />;
			})}
		</div>
	);
};

Contributors.propTypes = propTypes;
export default Contributors;
