import React from 'react';
import { ButtonGroup, Button } from '@blueprintjs/core';

import { AccentStyle, ImageUpload, InputField, SettingsSection } from 'components';
import { Callback, Community } from 'types';

import LabelWithInfo from '../LabelWithInfo';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const HeaderSettings = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const { headerLogo, headerColorType, useHeaderTextAccent, hideNav } = communityData;

	return (
		<SettingsSection
			title="Site Header"
			description={<>The site header is shown at the top of every page.</>}
		>
			<AccentStyle communityData={communityData} isNavHidden={!!hideNav} />
			<ImageUpload
				htmlFor="header-logo-upload"
				label={<LabelWithInfo label="Header logo" info="Recommended size: 40x150px" />}
				helperText={<>This will replace the Community name in the header.</>}
				defaultImage={headerLogo}
				height={80}
				width={150}
				onNewImage={(val) => {
					updateCommunityData({ headerLogo: val });
				}}
				useAccentBackground={true}
				canClear={true}
			/>
			<InputField
				label="Header Color"
				helperText="You can change these colors from the Details tab."
			>
				<ButtonGroup>
					<Button
						text="Light Accent Color"
						active={headerColorType === 'light'}
						onClick={() => {
							updateCommunityData({ headerColorType: 'light' });
						}}
					/>
					<Button
						text="Dark Accent Color"
						active={headerColorType === 'dark'}
						onClick={() => {
							updateCommunityData({ headerColorType: 'dark' });
						}}
					/>
				</ButtonGroup>
			</InputField>
			<InputField label="Header Text Color">
				<ButtonGroup>
					<Button
						text={headerColorType === 'light' ? 'Black' : 'White'}
						active={!useHeaderTextAccent}
						onClick={() => {
							updateCommunityData({ useHeaderTextAccent: false });
						}}
					/>
					<Button
						text={
							headerColorType === 'light' ? 'Dark Accent Color' : 'Light Accent Color'
						}
						active={useHeaderTextAccent}
						onClick={() => {
							updateCommunityData({ useHeaderTextAccent: true });
						}}
					/>
				</ButtonGroup>
			</InputField>
		</SettingsSection>
	);
};

export default HeaderSettings;
