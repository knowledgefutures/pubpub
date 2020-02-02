import React from 'react';
import PropTypes from 'prop-types';
import { ControlGroup, InputGroup, Button, Intent } from '@blueprintjs/core';
import { SettingsSection } from 'components';
import { usePageContext } from 'utils/hooks';
import MemberRow from './MemberRow';
import InheritedBlock from './InheritedBlock';

require('./dashboardMembers.scss');

const propTypes = {
	membersData: PropTypes.object.isRequired,
};

const DashboardMembers = (props) => {
	const { membersData } = props;
	const { scopeData } = usePageContext();
	const { activeTargetType } = scopeData.elements;
	// let scope = 'Community';
	// if (locationData.params.collectionSlug) {
	// 	scope = 'Collection';
	// }
	// if (locationData.params.pubSlug) {
	// 	scope = 'Pub';
	// }

	const membersByType = {
		pub: membersData.members.filter((mb) => mb.pubId),
		collection: membersData.members.filter((mb) => mb.collectionId),
		community: membersData.members.filter((mb) => mb.communityId),
		organization: membersData.members.filter((mb) => mb.organizationId),
	};

	const hasInheritedMembers =
		(membersByType.collection.length && activeTargetType !== 'collection') ||
		(membersByType.community.length && activeTargetType !== 'community') ||
		(membersByType.organization.length && activeTargetType !== 'organization');

	return (
		<div className="dashboard-members-container">
			<h2 className="dashboard-content-header">Members</h2>

			<SettingsSection title="Add Member">
				<ControlGroup>
					<InputGroup
						fill
						large
						placeholder="Search by name, username, or invite by email"
					/>
					<Button large text="Add" intent={Intent.PRIMARY} />
				</ControlGroup>
			</SettingsSection>

			<SettingsSection title="Members">
				{membersData.invitations.map((invitation) => {
					return <MemberRow isInvitation={true} memberData={invitation} />;
				})}
				{membersByType[activeTargetType].map((member) => {
					return <MemberRow memberData={member} />;
				})}
			</SettingsSection>
			{!!hasInheritedMembers && (
				<SettingsSection title="Inherited Members">
					{!!membersByType.collection.length && activeTargetType !== 'collection' && (
						<InheritedBlock members={membersByType.collection} scope="Collection" />
					)}
					{!!membersByType.community.length && activeTargetType !== 'community' && (
						<InheritedBlock members={membersByType.community} scope="Community" />
					)}
					{!!membersByType.organization.length && activeTargetType !== 'organization' && (
						<InheritedBlock members={membersByType.organization} scope="Organization" />
					)}
				</SettingsSection>
			)}
		</div>
	);
};

DashboardMembers.propTypes = propTypes;
export default DashboardMembers;
