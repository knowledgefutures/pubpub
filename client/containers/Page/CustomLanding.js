import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

require('./customLanding.scss');

const propTypes = {
	pageData: PropTypes.object.isRequired,
};

const CustomLanding = (props) => {
	const {
		pageData
	} = props;
	
	return (
		<div className="custom-landing-component">
			<div className="banner-bar grid">
				<span className="content">Recent Articles</span>
			</div>
			<div className="collections grid">

			</div>
		</div>
	);
};

CustomLanding.propTypes = propTypes;
export default CustomLanding;
