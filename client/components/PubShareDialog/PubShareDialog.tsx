import React from 'react';
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
import { usePubContext } from 'containers/Pub/pubHooks';
import { PubPageData } from 'types';

require('./pubShareDialog.scss');

type SharedProps = {
	pubData: PubPageData;
};

type PubShareDialogProps = SharedProps & {
	isOpen: boolean;
	onClose: (...args: any[]) => any;
};

type UrlOptions = {
	isDraft?: boolean;
	historyKey?: number;
	isReview?: boolean;
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

const AccessHashOptions = (props: SharedProps) => {
	const { pubData } = props;
	const { communityData, featureFlags } = usePageContext();
	const { historyData } = usePubContext();
	const { commentHash, reviewHash, viewHash, editHash, isRelease } = pubData;
	const renderCopyLabelComponent = (label, url) => {
		return (
			<ControlGroup className="hash-row">
				<ClickToCopyButton minimal={false} copyString={url}>
					Copy {label} URL
				</ClickToCopyButton>
				<InputGroup className="display-url" value={url} fill />
			</ControlGroup>
		);
	};
	const isDraft = !isRelease;

	const createAccessUrl = (accessHash: string | undefined, options?: UrlOptions) =>
		pubUrl(communityData, pubData, { accessHash, ...options });

	return (
		<div className="access-hash-options">
			<p>
				You can grant visitors permission to view, edit, or review the draft of this Pub by
				sharing a URL.
			</p>
			{viewHash && renderCopyLabelComponent('View', createAccessUrl(viewHash, { isDraft }))}
			{featureFlags.comments &&
				renderCopyLabelComponent(
					'Draft Comment',
					createAccessUrl(commentHash, {
						historyKey: historyData.currentKey,
						isDraft: true,
					}),
				)}
			{featureFlags.comments &&
				pubData.releases.length > 0 &&
				renderCopyLabelComponent('Release Comment', createAccessUrl(commentHash))}
			{editHash && renderCopyLabelComponent('Edit', createAccessUrl(editHash, { isDraft }))}
			{featureFlags.reviews &&
				renderCopyLabelComponent(
					'Draft Feedback',
					createAccessUrl(reviewHash, { isDraft }),
				)}
			{featureFlags.reviews &&
				pubData.releases.length > 0 &&
				renderCopyLabelComponent('Release Feedback', createAccessUrl(reviewHash))}
		</div>
	);
};

const MembersOptions = (props: SharedProps) => {
	const {
		pubData: {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'members' does not exist on type '{ membe... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type '(user: any) => any' is not assignable to typ... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							memberData={member}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
							isOnlyMemberInScope={membersByType[activeTargetType].length === 1}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
							isReadOnly={!canManage}
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(member: any, update: any) => any' is not as... Remove this comment to see the full error message
							onUpdate={updateMember}
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(member: any) => Promise<any>' is not assign... Remove this comment to see the full error message
							onDelete={removeMember}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
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

const PubShareDialog = (props: PubShareDialogProps) => {
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
export default PubShareDialog;
