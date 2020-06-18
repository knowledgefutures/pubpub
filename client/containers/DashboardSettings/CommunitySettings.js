import React, { useState } from 'react';
import { usePageContext } from 'utils/hooks';
import { ButtonGroup, Button, Tooltip, Switch, Card, AnchorButton } from '@blueprintjs/core';

import {
	Icon,
	Header,
	ColorInput,
	ImageUpload,
	InputField,
	SettingsSection,
	CollectionMultiSelect,
	NavBar,
	Footer,
} from 'components';
import { slugifyString } from 'utils/strings';
import { defaultFooterLinks } from 'utils/community';
import { getDashUrl } from 'utils/dashboard';
import { communityUrl } from 'utils/canonicalUrls';
import { isDevelopment } from 'utils/environment';
import { apiFetch } from 'client/utils/apiFetch';

import NavBuilder from './NavBuilder';

const CommunitySettings = () => {
	const { scopeData } = usePageContext();
	const { activeCommunity } = scopeData.elements;

	/* Export & Delete Mailto Props */
	const exportEmailBody = `
	Hello.
	%0D%0A%0D%0A
	I am writing to request an export of any PubPub community data associated with the community%20
	${activeCommunity.title} (${activeCommunity.subdomain}).
	`;

	const deleteEmailBody = `
	Hello.
	%0D%0A%0D%0A
	I am writing to request that the PubPub community ${activeCommunity.title}%20
	(${activeCommunity.subdomain}), and all data associated with that community, be deleted.
	%0D%0A%0D%0A
	I affirm that I have the legal authority to request this on behalf of my community,%20
	and understand that this action may be irreversible.
	`;

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	/* Details */
	const [title, setTitle] = useState(activeCommunity.title);
	const [subdomain, setSubdomain] = useState(activeCommunity.subdomain);
	const [description, setDescription] = useState(activeCommunity.description);
	const [avatar, setAvatar] = useState(activeCommunity.avatar);
	const [favicon, setFavicon] = useState(activeCommunity.favicon);
	const [accentColorLight, setAccentColorLight] = useState(activeCommunity.accentColorLight);
	const [accentColorDark, setAccentColorDark] = useState(activeCommunity.accentColorDark);
	/* Header */
	const [headerLogo, setHeaderLogo] = useState(activeCommunity.headerLogo);
	const [headerColorType, setHeaderColorType] = useState(activeCommunity.headerColorType);
	const [hideCreatePubButton, setHideCreatePubButton] = useState(
		activeCommunity.hideCreatePubButton || false,
	);
	const [defaultPubCollections, setDefaultPubCollections] = useState(
		activeCommunity.defaultPubCollections || [],
	);
	/* Navigation */
	const [hideNav, setHideNav] = useState(activeCommunity.hideNav || false);
	const [useHeaderTextAccent, setUseHeaderTextAccent] = useState(
		activeCommunity.useHeaderTextAccent || false,
	);
	const [navigation, setNavigation] = useState(activeCommunity.navigation);
	/* Homepage */
	const [heroLogo, setHeroLogo] = useState(activeCommunity.heroLogo);
	const [heroBackgroundImage, setHeroBackgroundImage] = useState(
		activeCommunity.heroBackgroundImage,
	);
	const [hideHero, setHideHero] = useState(activeCommunity.hideHero || false);
	const [hideHeaderLogo, setHideHeaderLogo] = useState(activeCommunity.hideHeaderLogo || false);
	const [heroBackgroundColor, setHeroBackgroundColor] = useState(
		activeCommunity.heroBackgroundColor,
	);
	const [heroTextColor, setHeroTextColor] = useState(activeCommunity.heroTextColor);
	const [useHeaderGradient, setUseHeaderGradient] = useState(
		activeCommunity.useHeaderGradient || false,
	);
	const [heroImage, setHeroImage] = useState(activeCommunity.heroImage);
	const [heroTitle, setHeroTitle] = useState(activeCommunity.heroTitle);
	const [heroText, setHeroText] = useState(activeCommunity.heroText);
	const [heroPrimaryButton, setHeroPrimaryButton] = useState(
		activeCommunity.heroPrimaryButton || {},
	);
	const [heroSecondaryButton, setHeroSecondaryButton] = useState(
		activeCommunity.heroSecondaryButton || {},
	);
	const [heroAlign, setHeroAlign] = useState(activeCommunity.heroAlign || 'left');
	/* Footer */
	const [footerLinks, setFooterLinks] = useState(activeCommunity.footerLinks);
	const [footerTitle, setFooterTitle] = useState(activeCommunity.footerTitle);
	const [footerImage, setFooterImage] = useState(activeCommunity.footerImage);
	const [footerImageKey, setFooterImageKey] = useState(Math.random());
	/* Social */
	const [website, setWebsite] = useState(activeCommunity.website || '');
	const [twitter, setTwitter] = useState(activeCommunity.twitter || '');
	const [facebook, setFacebook] = useState(activeCommunity.facebook || '');
	const [email, setEmail] = useState(activeCommunity.email || '');

	const stateVals = {
		title: title,
		subdomain: subdomain,
		description: description,
		avatar: avatar,
		favicon: favicon,
		accentColorLight: accentColorLight,
		accentColorDark: accentColorDark,
		headerLogo: headerLogo,
		headerColorType: headerColorType,
		hideCreatePubButton: hideCreatePubButton,
		defaultPubCollections: defaultPubCollections,
		hideNav: hideNav,
		useHeaderTextAccent: useHeaderTextAccent,
		navigation: navigation,
		heroLogo: heroLogo,
		heroBackgroundImage: heroBackgroundImage,
		hideHero: hideHero,
		hideHeaderLogo: hideHeaderLogo,
		heroBackgroundColor: heroBackgroundColor,
		heroTextColor: heroTextColor,
		useHeaderGradient: useHeaderGradient,
		heroImage: heroImage,
		heroTitle: heroTitle,
		heroText: heroText,
		heroPrimaryButton: heroPrimaryButton,
		heroSecondaryButton: heroSecondaryButton,
		heroAlign: heroAlign,
		footerLinks: footerLinks,
		footerTitle: footerTitle,
		footerImage: footerImage,
		website: website,
		twitter: twitter,
		facebook: facebook,
		email: email,
	};

	const handleSaveClick = (evt) => {
		evt.preventDefault();

		setIsLoading(true);
		setError(undefined);

		return apiFetch('/api/communities', {
			method: 'PUT',
			body: JSON.stringify({
				...stateVals,
				communityId: activeCommunity.id,
			}),
		})
			.then((nextCommunityData) => {
				if (isDevelopment()) {
					window.location.reload();
				} else {
					const communityPart = communityUrl(nextCommunityData);
					const dashPart = getDashUrl({ mode: 'settings' });
					window.location.href = communityPart + dashPart;
				}
			})
			.catch((err) => {
				console.error(err);
				setIsLoading(false);
				setError('Error Saving Settings');
			});
	};

	const pages = activeCommunity.pages || [];
	const activeHeroTextColor = heroTextColor || '#FFFFFF';

	return (
		<div className="community-settings-component">
			<div className="content-buttons">
				<InputField error={error}>
					<Button
						name="create"
						type="submit"
						className="bp3-button bp3-intent-primary save-community-button"
						onClick={handleSaveClick}
						text="Save Settings"
						disabled={!title || !subdomain}
						loading={isLoading}
					/>
				</InputField>
			</div>
			<h2 className="dashboard-content-header">Settings</h2>
			<SettingsSection title="Details">
				<InputField
					label="Title"
					type="text"
					isRequired={true}
					value={title}
					onChange={(evt) => {
						setTitle(evt.target.value);
					}}
				/>
				<InputField
					label="Domain"
					type="text"
					isRequired={true}
					value={subdomain}
					onChange={(evt) => {
						setSubdomain(slugifyString(evt.target.value));
					}}
				/>
				<InputField
					label="Description"
					type="text"
					isTextarea={true}
					value={description}
					onChange={(evt) => {
						setDescription(evt.target.value.substring(0, 280).replace(/\n/g, ' '));
					}}
				/>
				<div className="row-wrapper">
					<ImageUpload
						htmlFor="favicon-upload"
						label={
							<span>
								Favicon
								<Tooltip
									content={
										<span>
											Used for browser icons. Must be square.
											<br />
											Recommended: 50*50px
										</span>
									}
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						defaultImage={favicon}
						onNewImage={(val) => {
							setFavicon(val);
						}}
					/>
					<ImageUpload
						htmlFor="avatar-upload"
						label={
							<span>
								Preview
								<Tooltip
									content={
										<span>
											Used as default preview image for social sharing cards.
											<br />
											Recommended: 500*500px
										</span>
									}
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						defaultImage={avatar}
						onNewImage={(val) => {
							setAvatar(val);
						}}
					/>
				</div>
				<div className="row-wrapper">
					<InputField label="Dark Accent Color">
						<ColorInput
							value={accentColorDark}
							onChange={(val) => {
								setAccentColorDark(val.hex);
							}}
						/>
					</InputField>
					<InputField label="Light Accent Color">
						<ColorInput
							value={accentColorLight}
							onChange={(val) => {
								setAccentColorLight(val.hex);
							}}
						/>
					</InputField>
				</div>
			</SettingsSection>
			<SettingsSection title="Header">
				<ImageUpload
					htmlFor="header-logo-upload"
					label={
						<span>
							Header Logo
							<Tooltip
								content={
									<span>
										Used in the header bar.
										<br />
										Recommended: ~40*150px
									</span>
								}
								tooltipClassName="bp3-dark"
							>
								<Icon icon="info-sign" />
							</Tooltip>
						</span>
					}
					defaultImage={headerLogo}
					height={80}
					width={150}
					onNewImage={(val) => {
						setHeaderLogo(val);
					}}
					useAccentBackground={true}
					canClear={true}
				/>
				<InputField label="Header Color">
					<ButtonGroup>
						<Button
							text="Light"
							active={headerColorType === 'light'}
							onClick={() => {
								setHeaderColorType('light');
							}}
						/>
						<Button
							text="Dark"
							active={headerColorType === 'dark'}
							onClick={() => {
								setHeaderColorType('dark');
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
								setUseHeaderTextAccent(false);
							}}
						/>
						<Button
							text={headerColorType === 'light' ? 'Dark Accent' : 'Light Accent'}
							active={useHeaderTextAccent}
							onClick={() => {
								setUseHeaderTextAccent(true);
							}}
						/>
					</ButtonGroup>
				</InputField>
				<InputField>
					<Switch
						label={
							<span>
								Public &apos;New Pub&apos; button
								<Tooltip
									content={
										<span>
											Toggles &apos;New Pub&apos; button in header bar.
											<br />
											Button will always be available to community admins.
										</span>
									}
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						checked={!hideCreatePubButton}
						onChange={(evt) => {
							setHideCreatePubButton(!evt.target.checked);
						}}
					/>
				</InputField>
				<InputField
					label="Default 'New Pub' Collection"
					wrapperClassName={hideCreatePubButton ? 'disable-block' : ''}
				>
					<CollectionMultiSelect
						allCollections={activeCommunity.collections}
						selectedCollectionIds={defaultPubCollections || []}
						onItemSelect={(newCollectionId) => {
							const existingCollectionIds = defaultPubCollections || [];
							const newCollectionIds = [...existingCollectionIds, newCollectionId];
							setDefaultPubCollections(newCollectionIds);
						}}
						onRemove={(evt, collectionIndex) => {
							const existingCollectionIds = defaultPubCollections || [];
							const newCollectionIds = existingCollectionIds.filter(
								(item, filterIndex) => {
									return filterIndex !== collectionIndex;
								},
							);
							setDefaultPubCollections(newCollectionIds);
						}}
						placeholder="Select Collections..."
					/>
				</InputField>
			</SettingsSection>
			<SettingsSection title="Navigation">
				<InputField>
					<Switch
						large={true}
						label="Show Navigation Bar"
						checked={!hideNav}
						onChange={(evt) => {
							setHideNav(!evt.target.checked);
						}}
					/>
				</InputField>
				<div className={hideNav ? 'disable-block' : ''}>
					<InputField label="Navigation">
						<NavBuilder
							initialNav={activeCommunity.navigation}
							prefix={[activeCommunity.navigation[0]]}
							pages={pages}
							onChange={(val) => {
								setNavigation(val);
							}}
						/>
					</InputField>
					<InputField label="Preview">
						<NavBar
							previewContext={{
								communityData: {
									...activeCommunity,
									...stateVals,
								},
								locationData: {
									path: '/',
									queryString: '',
									params: {},
								},
								loginData: {},
								scopeData: scopeData,
							}}
						/>
					</InputField>
				</div>
			</SettingsSection>
			<SettingsSection title="Homepage">
				<div className="row-wrapper">
					<InputField>
						<Switch
							large={true}
							label="Show Homepage Banner"
							checked={!hideHero}
							onChange={(evt) => {
								setHideHero(!evt.target.checked);
							}}
						/>
					</InputField>
				</div>
				<div className={hideHero ? 'disable-block' : ''}>
					<div className="row-wrapper">
						<ImageUpload
							htmlFor="hero-logo-upload"
							label={
								<span>
									Banner Logo
									<Tooltip
										content={
											<span>
												Used on the landing page.
												<br />
												Recommended: ~200*750px
											</span>
										}
										tooltipClassName="bp3-dark"
									>
										<Icon icon="info-sign" />
									</Tooltip>
								</span>
							}
							defaultImage={heroLogo}
							height={80}
							width={150}
							onNewImage={(val) => {
								setHeroLogo(val);
							}}
							useAccentBackground={true}
							canClear={true}
						/>
						<ImageUpload
							htmlFor="hero-background-upload"
							label={
								<span>
									Banner Background
									<Tooltip
										content={
											<span>
												Used on the landing page.
												<br />
												Recommended: ~1200*800px
											</span>
										}
										tooltipClassName="bp3-dark"
									>
										<Icon icon="info-sign" />
									</Tooltip>
								</span>
							}
							defaultImage={heroBackgroundImage}
							onNewImage={(val) => {
								setHeroBackgroundImage(val);
							}}
							height={80}
							width={150}
							canClear={true}
						/>
						<ImageUpload
							htmlFor="hero-image-upload"
							label={
								<span>
									Banner Image
									<Tooltip
										content={
											<span>
												Used on the landing page.
												<br />
												Recommended: ~600*600px
											</span>
										}
										tooltipClassName="bp3-dark"
									>
										<Icon icon="info-sign" />
									</Tooltip>
								</span>
							}
							defaultImage={heroImage}
							onNewImage={(val) => {
								setHeroImage(val);
							}}
							height={80}
							width={150}
							canClear={true}
						/>
					</div>
					<InputField
						label="Banner Title"
						type="text"
						value={heroTitle}
						onChange={(evt) => {
							setHeroTitle(evt.target.value);
						}}
					/>
					<InputField
						label="Banner Text"
						type="text"
						value={heroText}
						onChange={(evt) => {
							setHeroText(evt.target.value);
						}}
					/>

					<div className="row-wrapper">
						<InputField>
							<Switch
								label="Hide Header Logo"
								checked={hideHeaderLogo}
								onChange={(evt) => {
									setHideHeaderLogo(evt.target.checked);
								}}
							/>
						</InputField>
						<InputField>
							<Switch
								label="Use Header Gradient"
								checked={useHeaderGradient}
								onChange={(evt) => {
									setUseHeaderGradient(evt.target.checked);
								}}
								disabled={!heroBackgroundImage}
							/>
						</InputField>
					</div>
					<div className="row-wrapper">
						<InputField label="Banner Background Color">
							<ColorInput
								value={heroBackgroundColor || activeCommunity.accentColorDark}
								onChange={(val) => {
									setHeroBackgroundColor(val.hex);
								}}
							/>
						</InputField>
						<InputField label="Banner Text Color">
							<ButtonGroup>
								<Button
									text="Light"
									active={activeHeroTextColor === '#FFFFFF'}
									onClick={() => {
										setHeroTextColor('#FFFFFF');
									}}
								/>
								<Button
									text="Dark"
									active={activeHeroTextColor === '#000000'}
									onClick={() => {
										setHeroTextColor('#000000');
									}}
								/>
							</ButtonGroup>
						</InputField>
					</div>

					<div className="row-wrapper">
						<InputField
							label="Primary Button Text"
							type="text"
							value={heroPrimaryButton.title}
							onChange={(evt) => {
								const val = evt.target.value;
								setHeroPrimaryButton({
									title: val,
									url: heroPrimaryButton.url,
								});
							}}
						/>
						<InputField
							label="Primary Button URL"
							type="text"
							value={heroPrimaryButton.url}
							onChange={(evt) => {
								const val = evt.target.value;
								setHeroPrimaryButton({
									title: heroPrimaryButton.title,
									url: val,
								});
							}}
						/>
					</div>
					<div className="row-wrapper">
						<InputField
							label="Secondary Button Text"
							type="text"
							value={heroSecondaryButton.title}
							onChange={(evt) => {
								const val = evt.target.value;
								setHeroSecondaryButton({
									title: val,
									url: heroSecondaryButton.url,
								});
							}}
						/>
						<InputField
							label="Secondary Button URL"
							type="text"
							value={heroSecondaryButton.url}
							onChange={(evt) => {
								const val = evt.target.value;
								setHeroSecondaryButton({
									title: heroSecondaryButton.title,
									url: val,
								});
							}}
						/>
					</div>

					<InputField label="Banner Align">
						<ButtonGroup>
							<Button
								text="Left"
								active={heroAlign === 'left'}
								onClick={() => {
									setHeroAlign('left');
								}}
							/>
							<Button
								text="Center"
								active={heroAlign === 'center'}
								onClick={() => {
									setHeroAlign('center');
								}}
							/>
						</ButtonGroup>
					</InputField>
				</div>
				<InputField label="Preview">
					<Header
						previewContext={{
							communityData: {
								...activeCommunity,
								...stateVals,
							},
							locationData: {
								path: '/',
								queryString: '',
								params: {},
							},
							loginData: {},
							scopeData: scopeData,
						}}
					/>
				</InputField>
			</SettingsSection>
			<SettingsSection title="Social">
				<InputField
					label="Website"
					type="text"
					value={website}
					onChange={(evt) => {
						setWebsite(evt.target.value);
					}}
				/>
				<InputField
					label="Twitter"
					type="text"
					value={twitter}
					helperText={`https://twitter.com/${twitter}`}
					onChange={(evt) => {
						setTwitter(evt.target.value);
					}}
				/>
				<InputField
					label="Facebook"
					type="text"
					value={facebook}
					helperText={`https://facebook.com/${facebook}`}
					onChange={(evt) => {
						setFacebook(evt.target.value);
					}}
				/>
				<InputField
					label="Contact Email"
					type="text"
					value={email}
					onChange={(evt) => {
						setEmail(evt.target.value);
					}}
				/>
			</SettingsSection>
			<SettingsSection title="Footer">
				<InputField
					label="Footer Title"
					type="text"
					value={footerTitle || ''}
					// helperText={`https://facebook.com/${facebook}`}
					onChange={(evt) => {
						setFooterTitle(evt.target.value);
					}}
					placeholder={activeCommunity.title}
				/>
				<ImageUpload
					key={footerImageKey}
					htmlFor="footer-logo-upload"
					label="Footer Logo"
					defaultImage={footerImage}
					height={80}
					width={150}
					onNewImage={(val) => {
						setFooterImage(val);
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
						setFooterImage(headerLogo);
						setFooterImageKey(Math.random());
					}}
				/>

				<InputField label="Footer Links">
					<NavBuilder
						initialNav={activeCommunity.footerLinks || defaultFooterLinks}
						suffix={defaultFooterLinks}
						pages={pages}
						onChange={(val) => {
							setFooterLinks(val);
						}}
						disableDropdown={true}
					/>
				</InputField>
				<InputField label="Preview">
					<Footer
						previewContext={{
							communityData: {
								...activeCommunity,
								...stateVals,
							},
							locationData: {
								path: '/',
								queryString: '',
								params: {},
							},
							loginData: {},
							scopeData: scopeData,
						}}
					/>
				</InputField>
			</SettingsSection>
			<SettingsSection title="Export & Delete">
				<Card>
					<h5>Data export</h5>
					<p>
						You can request an export of the data associated with your Community on
						PubPub using the button below.
					</p>
					<AnchorButton
						target="_blank"
						href={`mailto:privacy@pubpub.org?subject=Community+data+export+request&body=${exportEmailBody.trim()}`}
					>
						Request data export
					</AnchorButton>
				</Card>
				<Card>
					<h5>Community deletion</h5>
					<p>
						You can request that we completely delete your PubPub community using the
						button below. If you have published any notable Pubs, we may reserve the
						right to continue to display them based on the academic research exception
						to GDPR.
					</p>
					<AnchorButton
						intent="danger"
						target="_blank"
						href={`mailto:privacy@pubpub.org?subject=Community+deletion+request&body=${deleteEmailBody.trim()}`}
					>
						Request community deletion
					</AnchorButton>
				</Card>
			</SettingsSection>
		</div>
	);
};

export default CommunitySettings;
