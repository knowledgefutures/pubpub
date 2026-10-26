import React, { useState } from 'react';

import { Button } from '@blueprintjs/core';

import { Avatar } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import MemberRow from './MemberRow';

import './inheritedMembersBlock.scss';

type Props = {
	members: any[];
	scope: string;
	/** For scope "Org": the org that owns the community */
	org?: { title: string; slug: string } | null;
};

const renderExplanationForScope = (scope, currentScopeData, org?: Props['org']) => {
	const { elements } = currentScopeData;
	const currentTarget = elements.activeTargetName;
	if (scope === 'Org' && org) {
		return (
			<>
				These users have access to this {currentTarget} because they are members of{' '}
				<a href={`/org/${org.slug}`}>{org.title}</a>, which owns the{' '}
				{elements.activeCommunity.title} community. Their level comes from the org and is
				managed there.
			</>
		);
	}
	const communityTitle = elements.activeCommunity.title;
	const membersOfWhat =
		scope === 'Community' ? `the ${communityTitle} community` : 'a collection that contains it';
	const users = (
		<>
			These users are members of this {currentTarget} because they are members of{' '}
			{membersOfWhat}.
		</>
	);
	if (scope === 'Community' && currentScopeData.activePermissions.canManageCommunity) {
		return (
			<>
				{users} You can manage this list of members from the{' '}
				<a href={getDashUrl({ mode: 'members' })}>Community members tab.</a>
			</>
		);
	}
	return users;
};

const InheritedBlock = (props: Props) => {
	const { members, scope, org } = props;
	const [isOpen, setIsOpen] = useState(false);
	const { scopeData: currentScopeData } = usePageContext();
	return (
		<div className="inherited-members-block-component">
			<div className="top">
				<div className="scope">
					{scope === 'Org' && org
						? `Members via ${org.title}: ${members.length}`
						: `${scope} Members with access: ${members.length}`}
				</div>
				<Button
					outlined
					small
					text={isOpen ? 'Hide Details' : 'Show Details'}
					onClick={() => {
						setIsOpen(!isOpen);
					}}
				/>
			</div>
			{!isOpen && (
				<div className="preview-block">
					{members.map((member) => {
						return (
							<Avatar
								key={member.id}
								initials={member.user.initials}
								avatar={member.user.avatar}
								width={20}
							/>
						);
					})}
				</div>
			)}
			{isOpen && (
				<>
					<div className="explanation-block">
						{renderExplanationForScope(scope, currentScopeData, org)}
					</div>
					<div className="members-block">
						{members.map((member) => {
							return (
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
								<MemberRow memberData={member} key={member.id} isReadOnly={true} />
							);
						})}
					</div>
				</>
			)}
		</div>
	);
};
export default InheritedBlock;
