import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';
import { SettingsSection } from 'components';
import Settings from './Settings';
import Permissions from './Permissions';

require('./branches.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const Branches = (props) => {
	const { pubData, updateLocalData } = props;
	const [isLoading, setIsLoading] = useState(false);

	return (
		<div className="pub-manage_branches-component">
			{isLoading && (
				<div className="save-wrapper">
					<Spinner size={Spinner.SIZE_SMALL} /> Saving...
				</div>
			)}
			<h2>Branches</h2>
			<p>Branches are different forks of the document within a single pub.</p>

			{pubData.branches.map((branch) => {
				return (
					<SettingsSection title={branch.title} className="branch-wrapper" key={branch.id}>
						<Settings
							pubData={pubData}
							branchData={branch}
							updateLocalData={updateLocalData}
							setIsLoading={setIsLoading}
						/>
						<h5>Permissions</h5>
						<Permissions
							pubData={pubData}
							branchData={branch}
							updateLocalData={updateLocalData}
							setIsLoading={setIsLoading}
						/>
					</SettingsSection>
				);
			})}
		</div>
	);
};

Branches.propTypes = propTypes;
export default Branches;
