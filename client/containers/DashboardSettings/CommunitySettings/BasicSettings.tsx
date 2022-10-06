import React from 'react';

import { InputField, SettingsSection, ImageUpload, ColorInput } from 'components';
import { Callback, Community } from 'types';
import { slugifyString } from 'utils/strings';

import SettingsRow from '../SettingsRow';
import LabelWithInfo from '../LabelWithInfo';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const BasicSettings = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const {
		title,
		description,
		subdomain,
		publishAs,
		citeAs,
		favicon,
		accentColorDark,
		accentColorLight,
	} = communityData;

	return (
		<SettingsSection title="Basics">
			<InputField
				label="Title"
				type="text"
				isRequired={true}
				value={title}
				onChange={(evt) => {
					updateCommunityData({ title: evt.target.value });
				}}
			/>
			<InputField
				label="Domain"
				type="text"
				isRequired={true}
				value={subdomain}
				onChange={(evt) => {
					updateCommunityData({ subdomain: slugifyString(evt.target.value) });
				}}
			/>
			<InputField
				label="Description"
				type="text"
				isTextarea={true}
				value={description}
				onChange={(evt) => {
					updateCommunityData({
						description: evt.target.value.substring(0, 280).replace(/\n/g, ' '),
					});
				}}
			/>
			<InputField
				label="Journal Citation"
				htmlFor="journal-citation"
				helperText={
					<>
						If supplied, this field will be used as the Journal Title for Issue
						Collections in citations, PDF exports, and Crossref deposits.
					</>
				}
				type="text"
				value={citeAs}
				onChange={(evt) => {
					updateCommunityData({ citeAs: evt.target.value });
				}}
			/>
			<InputField
				htmlFor="publisher"
				label="Publisher"
				helperText={
					<>
						If supplied, this field will be used as the Publisher for Book and
						Conference Proceedings Collections in citations, PDF exports, and Crossref
						deposits.
					</>
				}
				type="text"
				value={publishAs}
				onChange={(evt) => {
					updateCommunityData({ publishAs: evt.target.value });
				}}
			/>
			<SettingsRow>
				<InputField label="Dark Accent Color">
					<ColorInput
						value={accentColorDark}
						onChange={(val) => {
							updateCommunityData({ accentColorDark: val.hex });
						}}
					/>
				</InputField>
				<InputField label="Light Accent Color">
					<ColorInput
						value={accentColorLight}
						onChange={(val) => {
							updateCommunityData({ accentColorLight: val.hex });
						}}
					/>
				</InputField>
			</SettingsRow>
			<ImageUpload
				htmlFor="favicon-upload"
				helperText="Shown in browser tabs. Must be square."
				label={<LabelWithInfo label="Favicon" info="Recommended size: 50x50px" />}
				canClear
				defaultImage={favicon}
				onNewImage={(val) => {
					updateCommunityData({ favicon: val });
				}}
			/>
		</SettingsSection>
	);
};

export default BasicSettings;
