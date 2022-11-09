import React from 'react';
import { Classes, Tooltip } from '@blueprintjs/core';

import { Avatar } from 'components';
import { PubCollabState } from '../usePubCollabState';

type Props = {
	collabData: PubCollabState;
};

const getUniqueCollaborators = (collaborators, isAnonymous) => {
	const uniqueCollaborators = {};
	collaborators.forEach((item) => {
		if (item.initials !== '?') {
			uniqueCollaborators[item.id] = item;
		}
	});
	const numAnonymous = Math.max(
		0,
		collaborators.reduce(
			(sum, collaborator) => (collaborator.initials === '?' ? sum + 1 : sum),
			0,
		) - (isAnonymous ? 1 : 0),
	);
	if (numAnonymous) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'anon' does not exist on type '{}'.
		uniqueCollaborators.anon = {
			backgroundColor: 'rgba(96,96,96, 0.2)',
			cursorColor: 'rgba(96,96,96, 1.0)',
			id: 'anon',
			initials: numAnonymous,
			name: `${numAnonymous} anonymous user${numAnonymous === 1 ? '' : 's'}`,
		};
	}
	return uniqueCollaborators;
};

const PubHeaderCollaborators = (props: Props) => {
	const { remoteCollabUsers, localCollabUser } = props.collabData;
	const uniqueCollaborators = getUniqueCollaborators(remoteCollabUsers, !localCollabUser.id);
	return (
		<div>
			{Object.keys(uniqueCollaborators)
				.map((key) => uniqueCollaborators[key])
				.filter((x) => x)
				.map((collaborator) => {
					return (
						<div className="avatar-wrapper" key={`present-avatar-${collaborator.id}`}>
							{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: any; tooltipCl... Remove this comment to see the full error message */}
							<Tooltip content={collaborator.name} tooltipClassName={Classes.DARK}>
								<Avatar
									/* Cast initials to string since
									the anonymous Avatar is a int count */
									initials={String(collaborator.initials)}
									avatar={collaborator.image}
									borderColor={collaborator.cursorColor}
									borderWidth="2px"
									width={24}
								/>
							</Tooltip>
						</div>
					);
				})}
		</div>
	);
};

export default PubHeaderCollaborators;
