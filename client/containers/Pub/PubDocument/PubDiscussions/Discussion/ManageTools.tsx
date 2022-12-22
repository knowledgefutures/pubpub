import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';

import { Icon, ConfirmDialog } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

import LabelSelect from './LabelSelect';
import DiscussionReanchor from './DiscussionReanchor';

const sortLabels = {
	chronological: 'Sort chronologically',
	alphabetical: 'Sort by contributor surname',
} as const;

export type SortType = keyof typeof sortLabels;

type Props = {
	pubData: {
		labels?: any[];
	};
	discussionData: {
		isClosed?: boolean;
		labels?: any[];
		userId?: string;
	};
	setSortType: (s: SortType) => any;
	sortType: SortType;
	onUpdateDiscussion: (...args: any[]) => any;
};

const ManageTools = (props: Props) => {
	const { pubData, discussionData, onUpdateDiscussion, sortType, setSortType } = props;
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

	const renderSortMenu = () => {
		if (!canAdmin) {
			return null;
		}
		return (
			<MenuButton
				buttonContent="Sort"
				aria-label="Sort comments by"
				buttonProps={{
					icon: <Icon icon="sort" iconSize={14} />,
					minimal: true,
					small: true,
				}}
			>
				{(Object.keys(sortLabels) as SortType[]).map((type) => (
					<MenuItem
						text={sortLabels[type]}
						icon={type === sortType ? 'tick' : 'blank'}
						onClick={() => setSortType(type)}
						key={type}
					/>
				))}
			</MenuButton>
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
			{renderSortMenu()}
			{isSuperAdmin && <DiscussionReanchor discussionData={discussionData} />}
		</div>
	);
};
export default ManageTools;
