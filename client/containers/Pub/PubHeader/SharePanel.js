import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';
import BranchPermissions from 'containers/Pub/PubManage/Branches/Permissions';
import ManagerPermissions from 'containers/Pub/PubManage/Managers/Permissions';

require('./sharePanel.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const SharePanel = function(props) {
	const { pubData, updateLocalData } = props;
	const [isLoading, setIsLoading] = useState(false);
	return (
		<div className="pub-header_share-panel-component">
			{isLoading && (
				<div className="save-wrapper">
					<Spinner size={Spinner.SIZE_SMALL} /> Saving...
				</div>
			)}

			<h3>Share this Branch (#{pubData.activeBranch.title})</h3>
			<BranchPermissions
				pubData={pubData}
				branchData={pubData.activeBranch}
				updateLocalData={updateLocalData}
				setIsLoading={setIsLoading}
			/>
			<a href={`/pub/${pubData.slug}/manage/branches`}>Manage all Branch options</a>

			<h3>Pub Managers</h3>
			<ManagerPermissions
				pubData={pubData}
				updateLocalData={updateLocalData}
				setIsLoading={setIsLoading}
			/>
		</div>
	);
};

SharePanel.propTypes = propTypes;
export default SharePanel;
