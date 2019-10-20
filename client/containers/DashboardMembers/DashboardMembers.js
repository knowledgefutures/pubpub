import React from 'react';
import PropTypes from 'prop-types';
import { ControlGroup, InputGroup, Button, Intent } from '@blueprintjs/core';
import { hydrateWrapper } from 'utils';
import { PageWrapper, SettingsSection } from 'components';
import MemberRow from './MemberRow';
import InheritedBlock from './InheritedBlock';

require('./dashboardMembers.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	membersData: PropTypes.object.isRequired,
};

const DashboardMembers = (props) => {
	const { communityData, locationData, loginData, membersData } = props;

	let scope = 'Community';
	if (locationData.params.collectionSlug) {
		scope = 'Collection';
	}
	if (true || locationData.params.pubSlug) {
		scope = 'Pub';
	}

	const pubMembers = membersData.members.filter((mb) => mb.pubId);
	const collectionMembers = membersData.members.filter(
		(mb) =>
			scope !== 'Collection' &&
			scope !== 'Community' &&
			scope !== 'Organization' &&
			mb.collectionId,
	);
	const communityMembers = membersData.members.filter(
		(mb) => scope !== 'Community' && scope !== 'Organization' && mb.communityId,
	);
	const organizationMembers = membersData.members.filter(
		(mb) => scope !== 'Organization' && mb.organizationId,
	);
	const hasInheritedMembers = !!(
		collectionMembers.length ||
		communityMembers.length ||
		organizationMembers.length
	);

	return (
		<div className="dashboard-members-container">
			<PageWrapper
				loginData={loginData}
				communityData={communityData}
				locationData={locationData}
				isDashboard={true}
			>
				<h2 className="dashboard-content-title">{scope} Members</h2>

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
					{pubMembers.map((member) => {
						return <MemberRow memberData={member} />;
					})}
				</SettingsSection>
				{hasInheritedMembers && (
					<SettingsSection title="Inherited Members">
						{!!collectionMembers.length && (
							<InheritedBlock members={collectionMembers} scope="Collection" />
						)}
						{!!communityMembers.length && (
							<InheritedBlock members={communityMembers} scope="Community" />
						)}
						{!!organizationMembers.length && (
							<InheritedBlock members={organizationMembers} scope="Organization" />
						)}
					</SettingsSection>
				)}
			</PageWrapper>
		</div>
	);
};

DashboardMembers.propTypes = propTypes;
export default DashboardMembers;

hydrateWrapper(DashboardMembers);
