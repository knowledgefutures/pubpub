import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reakit/Button';

import { Icon } from 'components';

require('./expandButton.scss');

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	isExpanded: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

const ExpandButton = (props) => {
	const { accentColor, isExpanded, onClick } = props;

	return (
		<Button as="div" className="expand-button-component" onClick={onClick} aria-hidden={true}>
			<div className="relative-container">
				<div className="icon-container" style={{ color: accentColor }}>
					<Icon icon={isExpanded ? 'chevron-up' : 'chevron-down'} />
				</div>
			</div>
		</Button>
	);
};

ExpandButton.propTypes = propTypes;
export default ExpandButton;
