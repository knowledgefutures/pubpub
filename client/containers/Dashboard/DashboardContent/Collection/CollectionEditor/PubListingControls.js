import React from 'react';
import PropTypes from 'prop-types';
import { Button, ControlGroup } from '@blueprintjs/core';

const propTypes = {
	onAdd: PropTypes.func.isRequired,
};

const PubListingControls = (props) => {
	const { onAdd } = props;
	return (
		<ControlGroup>
			<Button minimal aria-label="Add pub to collection" icon="plus" onClick={onAdd} />
		</ControlGroup>
	);
};

PubListingControls.propTypes = propTypes;
export default PubListingControls;
