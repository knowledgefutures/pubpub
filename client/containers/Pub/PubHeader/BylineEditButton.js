import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reakit/Button';

import { Icon } from 'components';

require('./bylineEditButton.scss');

const propTypes = {
	onClick: PropTypes.func.isRequired,
};

const BylineEditButton = (props) => {
	const { onClick } = props;
	return (
		<Button className="byline-edit-button-component" onClick={onClick} aria-label="Edit byline">
			<div className="icon-box pub-header-themed-box pub-header-themed-box-hover-target">
				<Icon icon="edit2" iconSize={14} />
			</div>
		</Button>
	);
};

BylineEditButton.propTypes = propTypes;
export default BylineEditButton;
