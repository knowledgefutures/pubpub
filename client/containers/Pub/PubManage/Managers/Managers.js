import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';
import Permissions from './Permissions';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const Managers = (props) => {
	const { pubData, updateLocalData } = props;
	const [isLoading, setIsLoading] = useState(false);

	return (
		<div className="pub-manage_managers-component">
			{isLoading && (
				<div className="save-wrapper">
					<Spinner size={Spinner.SIZE_SMALL} /> Saving...
				</div>
			)}
			<h2>Managers</h2>
			<p>Pub managers can edit pub details and add other managers.</p>
			<Permissions
				pubData={pubData}
				updateLocalData={updateLocalData}
				setIsLoading={setIsLoading}
			/>
		</div>
	);
};

Managers.propTypes = propTypes;
export default Managers;
