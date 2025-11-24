import type { Callback, Community } from 'types';

import React from 'react';

import { Button, Classes, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { ImageUpload, InputField, SettingsSection } from 'components';

import LabelWithInfo from '../LabelWithInfo';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const socialLocations = [
	{ title: 'header only.', key: 'header' } as const,
	{ title: 'footer only.', key: 'footer' } as const,
	{ title: 'header and footer.', key: null } as const,
];

const SocialSettings = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const {
		website,
		twitter,
		facebook,
		email,
		avatar,
		instagram,
		mastodon,
		linkedin,
		bluesky,
		github,
	} = communityData;

	const socialLocation = communityData.socialLinksLocation;

	return (
		<SettingsSection title="Social Media">
			<div className={Classes.FORM_GROUP}>
				<div>
					<span>These links will appear in your Community's &nbsp;</span>
					<Select
						items={socialLocations}
						itemRenderer={(page, { handleClick }) => {
							return (
								<MenuItem
									key={page.title}
									onClick={handleClick}
									text={page.title}
								/>
							);
						}}
						filterable={false}
						onItemSelect={(item) => {
							updateCommunityData({ socialLinksLocation: item.key });
						}}
						popoverProps={{ popoverClassName: Classes.MINIMAL }}
					>
						<Button
							className="linked-page-select-button"
							text={socialLocations.find((loc) => loc.key === socialLocation)?.title}
							rightIcon="chevron-down"
							minimal
							outlined
						/>
						&nbsp;
						<LabelWithInfo
							label=""
							info="Social links are never shown in the header on mobile devices."
						/>
					</Select>
				</div>
			</div>
			<InputField
				label="Website"
				type="text"
				value={website}
				onChange={(evt) => {
					updateCommunityData({ website: evt.target.value });
				}}
			/>
			<InputField
				label="X (Twitter)"
				type="text"
				value={twitter}
				helperText={`https://twitter.com/${twitter || '<your x/twitter hanlde>'}`}
				onChange={(evt) => {
					updateCommunityData({ twitter: evt.target.value });
				}}
			/>
			<InputField
				label="Instagram"
				type="text"
				value={instagram}
				helperText={`https://instagram.com/${instagram || '<your instagram handle>'}`}
				onChange={(evt) => {
					updateCommunityData({ instagram: evt.target.value });
				}}
			/>
			<InputField
				label="Mastodon"
				type="text"
				value={mastodon}
				helperText={`https://${mastodon || '<Mastodon instance URL>/@<handle>'}`}
				onChange={(evt) => {
					updateCommunityData({ mastodon: evt.target.value });
				}}
			/>
			<InputField
				label="LinkedIn"
				type="text"
				value={linkedin}
				helperText={`https://linkedin.com/${
					linkedin || '<in|company|school>/<your linkedin handle>'
				}`}
				onChange={(evt) => {
					updateCommunityData({ linkedin: evt.target.value });
				}}
			/>
			<InputField
				label="Bluesky"
				type="text"
				value={bluesky}
				helperText={`https://bsky.app/profile/${
					bluesky || '<your bluesky handle>.<your-server.social>'
				}`}
				onChange={(evt) => {
					updateCommunityData({ bluesky: evt.target.value });
				}}
			/>
			<InputField
				label="GitHub"
				type="text"
				value={github}
				helperText={`https://github.com/${github || '<your github handle>'}`}
				onChange={(evt) => {
					updateCommunityData({ github: evt.target.value });
				}}
			/>
			<InputField
				label="Facebook"
				type="text"
				value={facebook}
				helperText={`https://facebook.com/${facebook || '<your facebook handle>'}`}
				onChange={(evt) => {
					updateCommunityData({ facebook: evt.target.value });
				}}
			/>
			<InputField
				label="Contact Email"
				type="text"
				value={email}
				onChange={(evt) => {
					updateCommunityData({ email: evt.target.value });
				}}
			/>
			<ImageUpload
				canClear
				width={125}
				htmlFor="avatar-upload"
				helperText="Used as default preview image for social sharing cards."
				label={
					<LabelWithInfo
						label="Social preview image"
						info="Recommended size: 500x500px"
					/>
				}
				defaultImage={avatar}
				onNewImage={(val) => {
					updateCommunityData({ avatar: val });
				}}
			/>
		</SettingsSection>
	);
};

export default SocialSettings;
