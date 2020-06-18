import React from 'react';
import PropTypes from 'prop-types';
import { Button, Classes, ControlGroup, Dialog, Divider, InputGroup } from '@blueprintjs/core';

import {
	ClickToCopyButton,
	UserAutocomplete,
	MemberRow,
	InheritedMembersBlock,
	MenuConfigProvider,
	PendingChangesProvider,
} from 'components';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { useMembersState } from 'client/utils/members/useMembers';
import { pubUrl } from 'utils/canonicalUrls';

require('./pubShareDialog.scss');

const propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	pubData: PropTypes.shape({
		editHash: PropTypes.string,
		viewHash: PropTypes.string,
		isRelease: PropTypes.bool,
		membersData: PropTypes.shape({
			members: PropTypes.arrayOf(PropTypes.shape({})),
		}),
	}).isRequired,
};

const getHelperText = (activeTargetName, activeTargetType, canModifyMembers) => {
	if (canModifyMembers) {
		const containingPubsString =
			activeTargetType === 'pub' ? '' : " They'll have access to all the Pubs it contains.";
		return `To let others collaborate on this ${activeTargetName}, add them as Members.${containingPubsString}`;
	}
	const containingPubsString =
		activeTargetType === 'pub' ? '.' : ' as well as all the Pubs it contains.';

	return `Members can collaborate on this ${activeTargetName}${containingPubsString}`;
};

const AccessHashOptions = (props) => {
	const { pubData } = props;
	const { communityData } = usePageContext();
	const { viewHash, editHash, isRelease } = pubData;

	const renderHashRow = (label, hash) => {
		const url = pubUrl(communityData, pubData, {
			accessHash: hash,
			isDraft: !isRelease,
		});
		return (
			<ControlGroup className="hash-row">
				<ClickToCopyButton minimal={false} copyString={url}>
					Copy {label} URL
				</ClickToCopyButton>
				<InputGroup className="display-url" value={url} fill />
			</ControlGroup>
		);
	};

	return (
		<div className="access-hash-options">
			<p>
				You can grant visitors permission to view or edit the draft of this pub by sharing a
				URL.
			</p>
			{viewHash && renderHashRow('View', viewHash)}
			{editHash && renderHashRow('Edit', editHash)}
		</div>
	);
};

AccessHashOptions.propTypes = {
	pubData: PropTypes.shape({
		editHash: PropTypes.string,
		viewHash: PropTypes.string,
		isRelease: PropTypes.bool,
	}).isRequired,
};

const MembersOptions = (props) => {
	const {
		pubData: {
			membersData: { members },
		},
	} = props;
	const { pendingCount } = usePendingChanges();
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const { activeTargetName, activeTargetType } = scopeData.elements;
	const { membersByType, addMember, updateMember, removeMember } = useMembersState({
		initialMembers: members,
	});
	const localMembers = membersByType[activeTargetType];

	return (
		<React.Fragment>
			<p>{getHelperText(activeTargetName, activeTargetType, canManage)}</p>
			{canManage && (
				<ControlGroup className="add-member-controls">
					<UserAutocomplete
						onSelect={addMember}
						usedUserIds={localMembers.map((member) => member.userId)}
					/>
					<Button large text="Add" intent="primary" loading={pendingCount > 0} />
				</ControlGroup>
			)}
			<div className="members-container">
				{membersByType[activeTargetType].map((member) => {
					return (
						<MemberRow
							memberData={member}
							isOnlyMemberInScope={membersByType[activeTargetType].length === 1}
							isReadOnly={!canManage}
							onUpdate={updateMember}
							onDelete={removeMember}
							key={member.id}
						/>
					);
				})}
			</div>
			{!!membersByType.collection.length && activeTargetType !== 'collection' && (
				<InheritedMembersBlock members={membersByType.collection} scope="Collection" />
			)}
			{!!membersByType.community.length && activeTargetType !== 'community' && (
				<InheritedMembersBlock members={membersByType.community} scope="Community" />
			)}
			{!!membersByType.organization.length && activeTargetType !== 'organization' && (
				<InheritedMembersBlock members={membersByType.organization} scope="Organization" />
			)}
		</React.Fragment>
	);
};

MembersOptions.propTypes = {
	pubData: PropTypes.shape({
		membersData: PropTypes.shape({
			members: PropTypes.arrayOf(PropTypes.shape({})),
		}),
	}).isRequired,
};

const PubShareDialog = (props) => {
	const { isOpen, onClose, pubData } = props;
	const { viewHash, editHash } = pubData;
	const hasHash = !!(viewHash || editHash);

	const renderInner = () => {
		return (
			<React.Fragment>
				<div className="pane">
					<h6 className="pane-title">Members</h6>
					<div className="pane-content">
						<MembersOptions pubData={pubData} />
					</div>
				</div>
				{hasHash && (
					<React.Fragment>
						<Divider />
						<div className="pane">
							<h6 className="pane-title">Share a URL</h6>
							<AccessHashOptions pubData={pubData} />
						</div>
					</React.Fragment>
				)}
			</React.Fragment>
		);
	};

	return (
		<Dialog
			lazy={true}
			title="Share Pub"
			className="pub-share-dialog-component"
			isOpen={isOpen}
			onClose={onClose}
		>
			<MenuConfigProvider config={{ usePortal: false }}>
				<PendingChangesProvider>
					<div className={Classes.DIALOG_BODY}>{renderInner()}</div>
				</PendingChangesProvider>
			</MenuConfigProvider>
		</Dialog>
	);
};

PubShareDialog.propTypes = propTypes;
export default PubShareDialog;
