import type { IconName } from 'components';
import type { ActivityAssociations, Community } from 'types';
import type { ActivityItem } from 'types/activity';

import React from 'react';

import Color from 'color';

import { formatDate } from 'utils/dates';

import { CommunityHeader } from '../CommunityHeader';
import { Section } from '../Section';
import { Spacer } from '../Spacer';
import { Wrapper } from '../Wrapper';
import { ActivityBundle, DigestFooter, DigestIntro, DigestSectionTitle } from './index';

type DisplayKey = string;

type AffectedObjectId = string;

export type DedupedActivityItems = {
	items: Record<DisplayKey, ActivityItem>;
	title: string;
	url: string;
	icon: IconName;
};

export type GroupedActivityItems = Record<AffectedObjectId, DedupedActivityItems>;

type Props = {
	userId: string;
	community: Community;
	associations: ActivityAssociations;
	pubItems: GroupedActivityItems;
	communityItems: GroupedActivityItems;
};

export const Digest = (props: Props) => {
	const accentColorDark = props.community.accentColorDark ?? 'black';

	const hasCommunityActivity = Object.entries(props.communityItems).length > 0;
	const hasPubActivity = Object.entries(props.pubItems).length > 0;
	const today = new Date();
	const yesterday = new Date(today);

	yesterday.setDate(yesterday.getDate() - 1);

	return (
		<Wrapper
			preview={`Community activity for ${formatDate(yesterday)}`}
			backgroundColor={Color(accentColorDark).fade(0.975).rgb().string()}
		>
			<CommunityHeader date={yesterday} community={props.community} title="Activity Digest" />
			<DigestIntro
				date={yesterday}
				community={props.community}
				accentColorDark={accentColorDark}
			/>
			<Section alignment="left">
				{hasCommunityActivity && (
					<>
						<DigestSectionTitle
							icon="office"
							title="Community"
							accentColorDark={accentColorDark}
						/>
						<ol>
							{Object.entries(props.communityItems).map(
								([objectId, groupedItems]) => (
									<ActivityBundle
										key={objectId}
										groupedItems={groupedItems}
										isWithTitle={false}
										accentColorDark={accentColorDark}
										associations={props.associations}
										userId={props.userId}
									/>
								),
							)}
						</ol>
					</>
				)}
				{hasPubActivity && (
					<>
						<Spacer height={40}>
							<span>&nbsp;</span>
						</Spacer>
						<DigestSectionTitle
							icon="pubDoc"
							title="Pubs"
							accentColorDark={accentColorDark}
						/>
						<ol>
							{Object.entries(props.pubItems).map(([objectId, groupedItems]) => (
								<ActivityBundle
									key={objectId}
									groupedItems={groupedItems}
									isWithTitle={true}
									accentColorDark={accentColorDark}
									associations={props.associations}
									userId={props.userId}
								/>
							))}
						</ol>
					</>
				)}
				<DigestFooter community={props.community} />
			</Section>
		</Wrapper>
	);
};
