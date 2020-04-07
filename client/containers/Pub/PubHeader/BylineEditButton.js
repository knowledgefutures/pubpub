import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reakit/Button';

require('./bylineEditButton.scss');

const propTypes = {
	onClick: PropTypes.func.isRequired,
};

const BylineEditButton = (props) => {
	const { onClick } = props;
	return (
		<Button className="byline-edit-button-component" onClick={onClick}>
			<div className="box-style pub-header-themed-box pub-header-themed-box-hover-target">
				edit
			</div>
			<div className="inline-style">(Edit)</div>
		</Button>
	);
};

BylineEditButton.propTypes = propTypes;
export default BylineEditButton;
