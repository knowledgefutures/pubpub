import React from 'react';
import { Switch } from '@blueprintjs/core';

import { SettingsSection, NavBuilder, NavBar } from 'components';
import { Callback, Community, PageContext } from 'types';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
	previewContext: PageContext;
};

const NavSettings = (props: Props) => {
	const { communityData, updateCommunityData, previewContext } = props;
	const { hideNav, pages = [], collections = [] } = communityData;

	return (
		<>
			<SettingsSection title="Navigation">
				<Switch
					large={true}
					label="Show Navigation Bar"
					checked={!hideNav}
					onChange={(evt) => {
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
						updateCommunityData({ hideNav: !evt.target.checked });
					}}
				/>
				{!hideNav && (
					<>
						<NavBuilder
							initialNav={communityData.navigation}
							prefix={[communityData.navigation[0]]}
							pages={pages}
							collections={collections}
							onChange={(val) => {
								updateCommunityData({ navigation: val });
							}}
						/>
					</>
				)}
			</SettingsSection>
			{!hideNav && (
				<SettingsSection title="Preview">
					<NavBar previewContext={previewContext} />
				</SettingsSection>
			)}
		</>
	);
};

export default NavSettings;
