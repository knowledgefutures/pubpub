import React from 'react';

import { ImageUpload, InputField, SettingsSection } from 'components';
import { Callback, Community } from 'types';

import LabelWithInfo from '../LabelWithInfo';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const SocialSettings = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const { website, twitter, facebook, email, avatar } = communityData;

	return (
		<SettingsSection
			title="Social Media"
			description="These links will appear in your Community's header and footer."
		>
			<InputField
				label="Website"
				type="text"
				value={website}
				onChange={(evt) => {
					updateCommunityData({ website: evt.target.value });
				}}
			/>
			<InputField
				label="Twitter"
				type="text"
				value={twitter}
				helperText={`https://twitter.com/${twitter}`}
				onChange={(evt) => {
					updateCommunityData({ twitter: evt.target.value });
				}}
			/>
			<InputField
				label="Facebook"
				type="text"
				value={facebook}
				helperText={`https://facebook.com/${facebook}`}
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
