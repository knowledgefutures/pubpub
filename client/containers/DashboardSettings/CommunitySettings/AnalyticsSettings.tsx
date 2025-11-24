import type { Callback, Community } from 'types';

import React, { useMemo, useState } from 'react';

import { Button, Classes, Menu, MenuItem } from '@blueprintjs/core';

import { DropdownButton, InputField, SettingsSection } from 'components';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const AnalyticsSettings = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const { analyticsSettings } = communityData;

	const { type, credentials } = analyticsSettings || { type: 'default', credentials: null };

	const items = useMemo(() => {
		return {
			default: {
				title: 'Default',
				onClick: () => {
					updateCommunityData({ analyticsSettings: null });
				},
			},
			'google-analytics': {
				title: 'Google Analytics',
				onClick: () => {
					updateCommunityData({
						analyticsSettings: { type: 'google-analytics', credentials: 'G-' },
					});
				},
			},
			'simple-analytics': {
				title: 'Simple Analytics',
				onClick: () => {
					updateCommunityData({
						analyticsSettings: { type: 'simple-analytics', credentials: null },
					});
				},
			},
		};
	}, [updateCommunityData]);

	const [googleAnalyticsTest, setGoogleAnalyticsTest] = useState<boolean | null | 'failed'>(null);
	const [loading, setLoading] = useState(false);

	return (
		<SettingsSection title="Analytics">
			<div className={`input-field-component  ${Classes.FORM_GROUP}`}>
				<label className={Classes.LABEL} htmlFor="input-analytics-provider">
					Analtyics Provider
					<span className={`${Classes.TEXT_MUTED} required-text`}> (required)</span>
				</label>
				<DropdownButton label={items[type].title} isRightAligned={true}>
					<Menu>
						{Object.entries(items).map(([key, item]) => {
							return (
								<MenuItem
									key={`${key}-option`}
									text={item.title}
									onClick={item.onClick}
								/>
							);
						})}
					</Menu>
				</DropdownButton>
			</div>
			{type === 'google-analytics' && (
				<>
					<InputField
						label="Google Analytics ID"
						type="text"
						isRequired={true}
						value={credentials}
						isDisabled={!type}
						placeholder="G-"
						error={
							!credentials?.startsWith('G-') || credentials?.length < 5
								? 'Please enter a valid ID of form "G-<id>"'
								: undefined
						}
						onChange={(evt) => {
							return updateCommunityData({
								analyticsSettings: {
									type: 'google-analytics',
									credentials: evt.target.value,
								},
							});
						}}
					/>
					<Button
						text="Test Connection"
						type="submit"
						loading={loading && googleAnalyticsTest === null}
						onClick={() => {
							setGoogleAnalyticsTest(null);
							setLoading(true);
							// timeout improves UX to make it feel like it's actually doing something
							// immediately seeing an error is jarring
							setTimeout(() => {
								fetch(
									`https://www.googletagmanager.com/gtag/js?id=${analyticsSettings?.credentials}&l=ga4DataLayer`,
								)
									.then((res) => {
										console.log(res);
										setGoogleAnalyticsTest(res.ok);
										setLoading(false);
									})
									.catch((e) => {
										console.log(e);
										setGoogleAnalyticsTest('failed');
										setLoading(false);
									});
							}, 1000);
						}}
					/>
					{googleAnalyticsTest === true && (
						<p
							className={`${Classes.INTENT_SUCCESS} ${Classes.FORM_HELPER_TEXT} ${Classes.CALLOUT}`}
						>
							Google Analytics ID is valid!
						</p>
					)}
					{googleAnalyticsTest === false && (
						<p
							className={`${Classes.INTENT_DANGER} ${Classes.FORM_HELPER_TEXT} ${Classes.CALLOUT}`}
						>
							Google Analytics ID is invalid! Please check your ID and try again.{' '}
						</p>
					)}
					{googleAnalyticsTest === 'failed' && (
						<p
							className={`${Classes.INTENT_DANGER} ${Classes.FORM_HELPER_TEXT} ${Classes.CALLOUT}`}
						>
							Checking Google Analytics ID failed! Please disable any adblocking
							extensions and try again.
						</p>
					)}
				</>
			)}
		</SettingsSection>
	);
};

export default AnalyticsSettings;
