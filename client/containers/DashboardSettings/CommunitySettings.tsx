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
	DashboardFrame,
} from 'components';
import { slugifyString } from 'utils/strings';
import { defaultFooterLinks } from 'client/utils/navigation';
import { getDashUrl } from 'utils/dashboard';
import { communityUrl } from 'utils/canonicalUrls';
import { isDevelopment } from 'utils/environment';
import { apiFetch } from 'client/utils/apiFetch';

import NavBuilder from './NavBuilder';

const CommunitySettings = () => {
	const { scopeData, communityData } = usePageContext();

	/* Export & Delete Mailto Props */
	const exportEmailBody = `
	Hello.
	%0D%0A%0D%0A
	I am writing to request an export of any PubPub community data associated with the community%20
	${communityData.title} (${communityData.subdomain}).
	`;

	const deleteEmailBody = `
	Hello.
	%0D%0A%0D%0A
	I am writing to request that the PubPub community ${communityData.title}%20
	(${communityData.subdomain}), and all data associated with that community, be deleted.
	%0D%0A%0D%0A
	I affirm that I have the legal authority to request this on behalf of my community,%20
	and understand that this action may be irreversible.
	`;

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	/* Details */
	const [title, setTitle] = useState(communityData.title);
	const [subdomain, setSubdomain] = useState(communityData.subdomain);
	const [description, setDescription] = useState(communityData.description);
	const [avatar, setAvatar] = useState(communityData.avatar);
	const [favicon, setFavicon] = useState(communityData.favicon);
	const [accentColorLight, setAccentColorLight] = useState(communityData.accentColorLight);
	const [accentColorDark, setAccentColorDark] = useState(communityData.accentColorDark);
	/* Header */
	const [headerLogo, setHeaderLogo] = useState(communityData.headerLogo);
	const [headerColorType, setHeaderColorType] = useState(communityData.headerColorType);
	const [hideCreatePubButton, setHideCreatePubButton] = useState(
		communityData.hideCreatePubButton || false,
	);
	const [defaultPubCollections, setDefaultPubCollections] = useState(
		communityData.defaultPubCollections || [],
	);
	/* Navigation */
	const [hideNav, setHideNav] = useState(communityData.hideNav || false);
	const [useHeaderTextAccent, setUseHeaderTextAccent] = useState(
		communityData.useHeaderTextAccent || false,
	);
	const [navigation, setNavigation] = useState(communityData.navigation);
	/* Homepage */
	const [heroLogo, setHeroLogo] = useState(communityData.heroLogo);
	const [heroBackgroundImage, setHeroBackgroundImage] = useState(
		communityData.heroBackgroundImage,
	);
	const [hideHero, setHideHero] = useState(communityData.hideHero || false);
	const [hideHeaderLogo, setHideHeaderLogo] = useState(communityData.hideHeaderLogo || false);
	const [heroBackgroundColor, setHeroBackgroundColor] = useState(
		communityData.heroBackgroundColor,
	);
	const [heroTextColor, setHeroTextColor] = useState(communityData.heroTextColor);
	const [useHeaderGradient, setUseHeaderGradient] = useState(
		communityData.useHeaderGradient || false,
	);
	const [heroImage, setHeroImage] = useState(communityData.heroImage);
	const [heroTitle, setHeroTitle] = useState(communityData.heroTitle);
	const [heroText, setHeroText] = useState(communityData.heroText);
	const [heroPrimaryButton, setHeroPrimaryButton] = useState(
		communityData.heroPrimaryButton || {},
	);
	const [heroSecondaryButton, setHeroSecondaryButton] = useState(
		communityData.heroSecondaryButton || {},
	);
	const [heroAlign, setHeroAlign] = useState(communityData.heroAlign || 'left');
	/* Footer */
	const [footerLinks, setFooterLinks] = useState(communityData.footerLinks);
	const [footerTitle, setFooterTitle] = useState(communityData.footerTitle);
	const [footerLogoLink, setFooterLogoLink] = useState(communityData.footerLogoLink);
	const [footerImage, setFooterImage] = useState(communityData.footerImage);
	const [footerImageKey, setFooterImageKey] = useState(Math.random());
	/* Social */
	const [website, setWebsite] = useState(communityData.website || '');
	const [twitter, setTwitter] = useState(communityData.twitter || '');
	const [facebook, setFacebook] = useState(communityData.facebook || '');
	const [email, setEmail] = useState(communityData.email || '');

	const stateVals = {
		title,
		subdomain,
		description,
		avatar,
		favicon,
		accentColorLight,
		accentColorDark,
		headerLogo,
		headerColorType,
		hideCreatePubButton,
		defaultPubCollections,
		hideNav,
		useHeaderTextAccent,
		navigation,
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
		heroPrimaryButton,
		heroSecondaryButton,
		heroAlign,
		footerLinks,
		footerTitle,
		footerLogoLink,
		footerImage,
		website,
		twitter,
		facebook,
		email,
	};

	const handleSaveClick = (evt) => {
		evt.preventDefault();

		setIsLoading(true);
		setError(undefined);

		return apiFetch('/api/communities', {
			method: 'PUT',
			body: JSON.stringify({
				...stateVals,
				communityId: communityData.id,
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
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"Error Saving Settings"' is not ... Remove this comment to see the full error message
				setError('Error Saving Settings');
			});
	};

	const { pages = [], collections = [] } = communityData;
	const activeHeroTextColor = heroTextColor || '#FFFFFF';

	return (
		<DashboardFrame
			title="Settings"
			className="community-settings-component"
			controls={
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
			}
		>
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
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
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
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
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
								// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'string'.
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
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						checked={!hideCreatePubButton}
						onChange={(evt) => {
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
							setHideCreatePubButton(!evt.target.checked);
						}}
					/>
				</InputField>
				<InputField
					label="Default 'Create Pub' Collections"
					wrapperClassName={hideCreatePubButton ? 'disable-block' : ''}
				>
					<CollectionMultiSelect
						allCollections={communityData.collections}
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
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
							setHideNav(!evt.target.checked);
						}}
					/>
				</InputField>
				<div className={hideNav ? 'disable-block' : ''}>
					<InputField label="Navigation">
						<NavBuilder
							initialNav={communityData.navigation}
							prefix={[communityData.navigation[0]]}
							pages={pages}
							collections={collections}
							onChange={(val) => {
								setNavigation(val);
							}}
						/>
					</InputField>
					<InputField label="Preview">
						<NavBar
							previewContext={{
								communityData: {
									...communityData,
									...stateVals,
								},
								locationData: {
									path: '/',
									queryString: '',
									params: {},
								},
								loginData: {},
								scopeData,
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
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
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
										// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
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
												Recommended: ~1500*600px
											</span>
										}
										// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
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
										// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
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
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
									setHideHeaderLogo(evt.target.checked);
								}}
							/>
						</InputField>
						<InputField>
							<Switch
								label="Use Header Gradient"
								checked={useHeaderGradient}
								onChange={(evt) => {
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
									setUseHeaderGradient(evt.target.checked);
								}}
								disabled={!heroBackgroundImage}
							/>
						</InputField>
					</div>
					<div className="row-wrapper">
						<InputField label="Banner Background Color">
							<ColorInput
								value={heroBackgroundColor || communityData.accentColorDark}
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
								...communityData,
								...stateVals,
							},
							locationData: {
								path: '/',
								queryString: '',
								params: {},
							},
							loginData: {},
							scopeData,
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
					onChange={(evt) => {
						setFooterTitle(evt.target.value);
					}}
					placeholder={communityData.title}
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
				<InputField
					label="Footer Logo Link"
					type="text"
					value={footerLogoLink || ''}
					onChange={(evt) => {
						setFooterLogoLink(evt.target.value);
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
							setFooterLinks(val);
						}}
						disableDropdown={true}
					/>
				</InputField>
				<InputField label="Preview">
					<Footer
						previewContext={{
							communityData: {
								...communityData,
								...stateVals,
							},
							locationData: {
								path: '/',
								queryString: '',
								params: {},
							},
							loginData: {},
							scopeData,
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
		</DashboardFrame>
	);
};

export default CommunitySettings;
