import type { Callback, Community } from 'types';

import React from 'react';

import { ColorInput, ImageUpload, InputField, SettingsSection } from 'components';
import normalizeIssn from 'utils/crossref/transform/issn';
import { slugifyString } from 'utils/strings';

import LabelWithInfo from '../LabelWithInfo';
import SettingsRow from '../SettingsRow';

const getIssnError = (value: string | null) =>
	value?.trim() && !normalizeIssn(value)
		? "This isn't a valid ISSN, so it will be left out of Crossref deposits."
		: undefined;

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
		electronicIssn,
		printIssn,
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
			<SettingsRow>
				<InputField
					label="Electronic ISSN"
					htmlFor="electronic-issn"
					placeholder="e.g. 2644-2353"
					helperText="Used in DOI deposits and citations for pubs not in an issue, and in issues without their own ISSNs. Crossref only accepts an ISSN with the exact journal title it has registered."
					error={getIssnError(electronicIssn)}
					type="text"
					value={electronicIssn ?? ''}
					onChange={(evt) => {
						updateCommunityData({ electronicIssn: evt.target.value.trim() || null });
					}}
				/>
				<InputField
					label="Print ISSN"
					htmlFor="print-issn"
					placeholder="e.g. 2688-8513"
					helperText="Leave empty if the journal has no print edition."
					error={getIssnError(printIssn)}
					type="text"
					value={printIssn ?? ''}
					onChange={(evt) => {
						updateCommunityData({ printIssn: evt.target.value.trim() || null });
					}}
				/>
			</SettingsRow>
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
