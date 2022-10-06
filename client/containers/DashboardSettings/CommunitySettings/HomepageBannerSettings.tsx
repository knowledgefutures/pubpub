import React from 'react';
import { ButtonGroup, Button, Switch, Checkbox } from '@blueprintjs/core';

import { ColorInput, Header, ImageUpload, InputField, SettingsSection } from 'components';
import { Callback, Community, PageContext } from 'types';

import LabelWithInfo from '../LabelWithInfo';
import SettingsRow from '../SettingsRow';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
	previewContext: PageContext;
};

const HomepageBannerSettings = (props: Props) => {
	const { communityData, updateCommunityData, previewContext } = props;
	const {
		heroLogo,
		heroBackgroundImage,
		hideHero,
		hideHeaderLogo,
		heroBackgroundColor,
		heroTextColor,
		useHeaderGradient,
		heroImage,
		heroTitle,
		heroText,
		heroPrimaryButton = { title: '', url: '' },
		heroSecondaryButton = { title: '', url: '' },
		heroAlign = 'left',
	} = communityData;
	const activeHeroTextColor = heroTextColor || '#FFFFFF';

	return (
		<>
			<SettingsSection
				title="Homepage Banner"
				description={
					<>The homepage can optionally display a large banner with text and buttons.</>
				}
			>
				<InputField>
					<Switch
						large={true}
						label="Use homepage banner"
						checked={!hideHero}
						onChange={(evt: any) => {
							updateCommunityData({ hideHero: !evt.target.checked });
						}}
					/>
				</InputField>
				{!hideHero && (
					<>
						<SettingsRow>
							<ImageUpload
								htmlFor="hero-logo-upload"
								label={
									<LabelWithInfo
										label="Banner logo"
										info="Recommended size: 200x750px"
									/>
								}
								defaultImage={heroLogo}
								height={80}
								width={150}
								onNewImage={(val) => {
									updateCommunityData({ heroLogo: val });
								}}
								useAccentBackground={true}
								canClear={true}
							/>
							<ImageUpload
								htmlFor="hero-background-upload"
								label={
									<LabelWithInfo
										label="Banner background"
										info="Recommended size: 1500x600px"
									/>
								}
								defaultImage={heroBackgroundImage}
								onNewImage={(val) => {
									updateCommunityData({ heroBackgroundImage: val });
								}}
								height={80}
								width={150}
								canClear={true}
							/>
							<ImageUpload
								htmlFor="hero-image-upload"
								label={
									<LabelWithInfo
										label="Banner image"
										info="Recommended size: 600x600px"
									/>
								}
								defaultImage={heroImage}
								onNewImage={(val) => {
									updateCommunityData({ heroImage: val });
								}}
								height={80}
								width={150}
								canClear={true}
							/>
						</SettingsRow>
						{heroBackgroundImage && (
							<InputField>
								<Checkbox
									label="Fade site header into banner background"
									checked={useHeaderGradient}
									onChange={(evt: any) => {
										updateCommunityData({
											useHeaderGradient: evt.target.checked,
										});
									}}
									disabled={!heroBackgroundImage}
								/>
							</InputField>
						)}
						<InputField
							label="Banner Title"
							type="text"
							value={heroTitle}
							onChange={(evt) => {
								updateCommunityData({ heroTitle: evt.target.value });
							}}
						/>
						<InputField
							label="Banner Text"
							type="text"
							value={heroText}
							onChange={(evt) => {
								updateCommunityData({ heroText: evt.target.value });
							}}
						/>
						<InputField>
							<Checkbox
								label="Hide site header logo on homepage"
								checked={hideHeaderLogo}
								onChange={(evt: any) => {
									updateCommunityData({ hideHeaderLogo: evt.target.checked });
								}}
							/>
						</InputField>
						<SettingsRow gap={30}>
							<InputField label="Banner Background Color">
								<ColorInput
									value={heroBackgroundColor || communityData.accentColorDark}
									onChange={(val) => {
										updateCommunityData({ heroBackgroundColor: val.hex });
									}}
								/>
							</InputField>
							<InputField label="Banner Text Color">
								<ButtonGroup>
									<Button
										text="Light"
										active={activeHeroTextColor === '#FFFFFF'}
										onClick={() => {
											updateCommunityData({ heroTextColor: '#FFFFFF' });
										}}
									/>
									<Button
										text="Dark"
										active={activeHeroTextColor === '#000000'}
										onClick={() => {
											updateCommunityData({ heroTextColor: '#000000' });
										}}
									/>
								</ButtonGroup>
							</InputField>
							<InputField label="Banner Align">
								<ButtonGroup>
									<Button
										text="Left"
										active={heroAlign === 'left'}
										onClick={() => {
											updateCommunityData({ heroAlign: 'left' });
										}}
									/>
									<Button
										text="Center"
										active={heroAlign === 'center'}
										onClick={() => {
											updateCommunityData({ heroAlign: 'center' });
										}}
									/>
								</ButtonGroup>
							</InputField>
						</SettingsRow>
						<SettingsRow>
							<InputField
								label="Primary Button Text"
								type="text"
								value={heroPrimaryButton.title}
								onChange={(evt) => {
									const val = evt.target.value;
									updateCommunityData({
										heroPrimaryButton: {
											...heroPrimaryButton,
											title: val,
										},
									});
								}}
							/>
							<InputField
								label="Primary Button URL"
								type="text"
								value={heroPrimaryButton.url}
								onChange={(evt) => {
									const val = evt.target.value;
									updateCommunityData({
										heroPrimaryButton: {
											...heroPrimaryButton,
											url: val,
										},
									});
								}}
							/>
						</SettingsRow>
						<SettingsRow>
							<InputField
								label="Secondary Button Text"
								type="text"
								value={heroSecondaryButton.title}
								onChange={(evt) => {
									const val = evt.target.value;
									updateCommunityData({
										heroSecondaryButton: {
											...heroSecondaryButton,
											title: val,
										},
									});
								}}
							/>
							<InputField
								label="Secondary Button URL"
								type="text"
								value={heroSecondaryButton.url}
								onChange={(evt) => {
									const val = evt.target.value;
									updateCommunityData({
										heroSecondaryButton: {
											...heroSecondaryButton,
											url: val,
										},
									});
								}}
							/>
						</SettingsRow>
					</>
				)}
			</SettingsSection>
			<SettingsSection title="Preview (homepage)">
				<Header previewContext={previewContext} />
			</SettingsSection>
		</>
	);
};

export default HomepageBannerSettings;
