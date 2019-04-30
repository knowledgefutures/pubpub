import React from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox } from '@blueprintjs/core';
import { Icon, Avatar, SharingCard, UserAutocomplete } from 'components';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const Branches = (props) => {
	const { pubData } = props;
	return (
		<div className="pub-manage_branches-component">
			<h2>Branches</h2>
			<p>Branches are different forks of the document within a single pub.</p>
			
		</div>
	);
};

Branches.propTypes = propTypes;
export default Branches;
