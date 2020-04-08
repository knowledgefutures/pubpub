import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { Avatar } from 'components';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

import MemberRow from './MemberRow';

require('./inheritedMembersBlock.scss');

const propTypes = {
	members: PropTypes.array.isRequired,
	scope: PropTypes.string.isRequired,
};

const renderExplanationForScope = (scope, currentScopeData) => {
	const { elements } = currentScopeData;
	const currentTarget = elements.activeTargetName;
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

const InheritedBlock = (props) => {
	const { members, scope } = props;
	const [isOpen, setIsOpen] = useState(false);
	const { scopeData: currentScopeData } = usePageContext();
	return (
		<div className="inherited-members-block-component">
			<div className="top">
				<div className="scope">
					{scope} Members with access: {members.length}
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
						{renderExplanationForScope(scope, currentScopeData)}
					</div>
					<div className="members-block">
						{members.map((member) => {
							return (
								<MemberRow memberData={member} key={member.id} isReadOnly={true} />
							);
						})}
					</div>
				</>
			)}
		</div>
	);
};

InheritedBlock.propTypes = propTypes;
export default InheritedBlock;
