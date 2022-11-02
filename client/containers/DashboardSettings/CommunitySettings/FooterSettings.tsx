import React from 'react';
import { Button } from '@blueprintjs/core';

import { ImageUpload, InputField, SettingsSection, NavBuilder, Footer } from 'components';
import { Callback, Community, PageContext } from 'types';
import { communityUrl } from 'utils/canonicalUrls';
import { defaultFooterLinks } from 'client/utils/navigation';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
	previewContext: PageContext;
};

const FooterSettings = (props: Props) => {
	const { communityData, updateCommunityData, previewContext } = props;
	const {
		headerLogo,
		footerTitle,
		footerLogoLink,
		footerImage,
		pages = [],
		collections = [],
	} = communityData;

	return (
		<>
			<SettingsSection title="Footer">
				<InputField
					label="Footer Title"
					type="text"
					value={footerTitle || ''}
					onChange={(evt) => {
						updateCommunityData({ footerTitle: evt.target.value });
					}}
					placeholder={communityData.title}
				/>
				<ImageUpload
					key={footerImage}
					htmlFor="footer-logo-upload"
					label="Footer Logo"
					defaultImage={footerImage}
					height={80}
					width={150}
					onNewImage={(val) => {
						updateCommunityData({ footerImage: val });
					}}
					useAccentBackground={true}
					canClear={true}
				/>
				<Button
					small
					style={{ margin: '-10px 0px 20px' }}
					text="Use Header Logo"
					disabled={!headerLogo || footerImage === headerLogo}
					onClick={() => {
						updateCommunityData({ footerImage: headerLogo });
					}}
				/>
				<InputField
					label="Footer Logo Link"
					type="text"
					value={footerLogoLink || ''}
					onChange={(evt) => {
						updateCommunityData({ footerLogoLink: evt.target.value });
					}}
					placeholder={communityUrl(communityData)}
				/>
				<InputField label="Footer Links">
					<NavBuilder
						initialNav={communityData.footerLinks || defaultFooterLinks}
						suffix={defaultFooterLinks}
						pages={pages}
						collections={collections}
						onChange={(val) => {
							updateCommunityData({ footerLinks: val });
						}}
						disableDropdown={true}
					/>
				</InputField>
			</SettingsSection>
			<SettingsSection title="Preview">
				<Footer previewContext={previewContext} />
			</SettingsSection>
		</>
	);
};

export default FooterSettings;
