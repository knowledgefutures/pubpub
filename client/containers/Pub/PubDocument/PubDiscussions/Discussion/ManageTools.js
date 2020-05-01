import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { Icon, ConfirmDialog } from 'components';
import { usePageContext } from 'utils/hooks';

import LabelSelect from './LabelSelect';
import DiscussionReanchor from './DiscussionReanchor';

const propTypes = {
	pubData: PropTypes.shape({ labels: PropTypes.array }).isRequired,
	discussionData: PropTypes.shape({
		isClosed: PropTypes.bool,
		labels: PropTypes.array,
		userId: PropTypes.string,
	}).isRequired,
	onUpdateDiscussion: PropTypes.func.isRequired,
};

const ManageTools = (props) => {
	const { pubData, discussionData, onUpdateDiscussion } = props;
	const { scopeData } = usePageContext();
	const { canAdmin, isSuperAdmin } = scopeData.activePermissions;
	const { isClosed } = discussionData;
	const [isArchiving, setIsArchiving] = useState(false);

	const handleToggleArchive = () => {
		setIsArchiving(true);
		onUpdateDiscussion({ isClosed: !isClosed });
	};

	const renderArchiveButton = () => {
		if (discussionData.isClosed && !canAdmin) {
			return null;
		}

		const verb = isClosed ? 'Unarchive' : 'Archive';
		return (
			<ConfirmDialog
				onConfirm={handleToggleArchive}
				confirmLabel={verb}
				text={`Are you sure you want to ${verb.toLowerCase()} this discussion?`}
			>
				{({ open }) => (
					<Button
						icon={<Icon icon={isClosed ? 'export' : 'import'} iconSize={12} />}
						minimal={true}
						small={true}
						loading={isArchiving}
						onClick={open}
					>
						{verb}
					</Button>
				)}
			</ConfirmDialog>
		);
	};

	return (
		<div className="manage-tools-component">
			<LabelSelect
				availableLabels={pubData.labels || []}
				labelsData={discussionData.labels || []}
				onPutDiscussion={onUpdateDiscussion}
				canAdminPub={canAdmin}
			/>
			{renderArchiveButton()}
			{isSuperAdmin && <DiscussionReanchor discussionData={discussionData} />}
		</div>
	);
};

ManageTools.propTypes = propTypes;
export default ManageTools;
