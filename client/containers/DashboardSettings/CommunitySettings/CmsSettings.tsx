import type { Callback, Community } from 'types';

import React from 'react';

import { Callout, Switch } from '@blueprintjs/core';

import { InputField, SettingsSection, SuperAdminTag } from 'components';
import { usePageContext } from 'utils/hooks';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const CmsSettings = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const { cmsMode, canonicalBaseUrl, canonicalPubUrlTemplate } = communityData;
	const {
		scopeData: {
			activePermissions: { isSuperAdmin },
		},
	} = usePageContext();

	return (
		<SettingsSection
			id="cms-mode"
			title={
				<>
					CMS mode <SuperAdminTag />
				</>
			}
			description={
				<>
					In CMS mode, PubPub is used only for writing and editing: your community is
					visible to members alone, and everyone else sees a not-found page with a sign-in
					prompt. If a canonical URL is set, citations, exports, deposits, and connections
					from other communities will point to the external site where your content is
					published (for example, a site fed by your Underlay collection).
				</>
			}
		>
			<Switch
				checked={!!cmsMode}
				label="Enable CMS mode"
				onChange={(evt) => {
					updateCommunityData({ cmsMode: (evt.target as HTMLInputElement).checked });
				}}
			/>
			{cmsMode && (
				<Callout intent="warning" icon="warning-sign">
					Your community is only visible to members. Public visitors will see a
					&ldquo;community not found&rdquo; page with an option to log in.
				</Callout>
			)}
			{isSuperAdmin && (
				<>
					<InputField
						label={
							<>
								Canonical URL <SuperAdminTag />
							</>
						}
						helperText="The external site where this community's content is published, e.g. https://journal.example.org. Canonical tags, citations, exports, and new Crossref deposits will point to it."
						type="text"
						placeholder="https://journal.example.org"
						value={canonicalBaseUrl || ''}
						onChange={(evt) => {
							updateCommunityData({
								canonicalBaseUrl: evt.target.value.trim() || null,
							});
						}}
					/>
					<InputField
						label={
							<>
								Pub URL template <SuperAdminTag />
							</>
						}
						helperText={
							<>
								Where a pub lives on the external site, with <code>{'{slug}'}</code>{' '}
								standing in for the pub slug, e.g.{' '}
								<code>{'https://journal.example.org/articles/{slug}'}</code>. Leave
								empty to use the canonical URL + <code>/pub/{'{slug}'}</code>.
							</>
						}
						type="text"
						placeholder="https://journal.example.org/articles/{slug}"
						value={canonicalPubUrlTemplate || ''}
						onChange={(evt) => {
							updateCommunityData({
								canonicalPubUrlTemplate: evt.target.value.trim() || null,
							});
						}}
					/>
				</>
			)}
		</SettingsSection>
	);
};

export default CmsSettings;
