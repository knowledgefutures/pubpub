import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';
import { SettingsSection } from 'components';
import Settings from './Settings';
import Permissions from './Permissions';

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
					<SettingsSection title={branch.title} key={branch.id}>
						<Settings
							pubData={pubData}
							branchData={branch}
							updateLocalData={updateLocalData}
							setIsLoading={setIsLoading}
						/>
						<p>Permissions</p>
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
