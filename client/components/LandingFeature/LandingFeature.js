import React from 'react';
import PropTypes from 'prop-types';

require('./landingFeature.scss');

const propTypes = {
	title: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
};

const LandingFeature = function(props) {
	return (
		<div className="landing-feature-component">
			<div>
				<span className={`bp3-icon-large bp3-icon-${props.icon}`} />
			</div>
			<div>
				<div className="title">{props.title}</div>
				<div className="description">{props.description}</div>
			</div>
		</div>
	);
};

LandingFeature.propTypes = propTypes;
export default LandingFeature;
