import type { CommunityTemplate, Hub } from 'types';

import React, { useEffect, useRef, useState } from 'react';

import { Button, Callout, Checkbox, Classes, NonIdealState } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { Altcha, ColorInput, GridWrapper, Honeypot, ImageUpload, InputField } from 'components';
import { usePageContext } from 'utils/hooks';
import { slugifyString } from 'utils/strings';

import TemplatePicker, { CLONE_MARKER } from './TemplatePicker';
import './communityCreate.scss';

import { communityUrl } from 'utils/canonicalUrls';

const mountDonorboxWidget = (container: HTMLDivElement) => {
	const script = document.createElement('script');
	script.type = 'module';
	script.src = 'https://donorbox.org/widgets.js';
	script.async = true;

	const widget = document.createElement('dbox-widget');
	widget.setAttribute('campaign', 'pubpub-sustainability-fund');
	widget.setAttribute('type', 'donation_form');
	widget.setAttribute('enable-auto-scroll', 'true');

	container.appendChild(script);
	container.appendChild(widget);
};

const CommunityCreatedView = ({ subdomain, hubName }: { subdomain: string; hubName?: string }) => {
	const donorboxRef = useRef<HTMLDivElement>(null);
	const url = communityUrl({ subdomain });

	useEffect(() => {
		if (donorboxRef.current) {
			mountDonorboxWidget(donorboxRef.current);
		}
	}, []);

	return (
		<div className="community-created-layout">
			<div className="community-created-text">
				<h1>Community Created!</h1>
				{hubName ? (
					<p>
						Your community has been created and approved as part of the{' '}
						<strong>{hubName}</strong> hub. You can start using it right away.
					</p>
				) : (
					<p>
						Your community has been successfully created but is not yet publicly
						visible. All features remain available, but only logged-in Members will be
						able to view the community. When you're ready for it to be publicly visible,
						click "Request Approval" in the banner at the bottom of the page.
					</p>
				)}
				<h2>Your Support Keeps PubPub Free and Open</h2>
				<p>
					PubPub is stewarded by a nonprofit hub,{' '}
					<a
						href="https://knowledgefutures.org"
						target="_blank"
						rel="noopener noreferrer"
					>
						Knowledge Futures
					</a>
					, and kept free and open through support from communities like yours. If this
					platform helps your work, please consider making a donation to help sustain and
					improve it for everyone.
				</p>
				<a
					href={url}
					className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY} ${Classes.LARGE} continue-button`}
				>
					Continue to your community
				</a>
			</div>
			<div className="community-created-donate" ref={donorboxRef} />
		</div>
	);
};

type Props = {
	hubData?: Hub | null;
	templates?: CommunityTemplate[];
	hubCommunities?: { id: string; title: string; subdomain: string; avatar?: string | null }[];
};

const HubBrandedHeader = ({ hub }: { hub: Hub }) => {
	const accentDark = hub.accentColorDark || '#2D2E2F';
	const accentLight = hub.accentColorLight || '#FFFFFF';
	return (
		<div className="hub-branded-header" style={{ backgroundColor: accentDark }}>
			<div className="hub-branded-header-inner">
				<a
					href={`/hub/${hub.slug}`}
					className="hub-branded-back"
					style={{ color: accentLight }}
				>
					<span className="back-arrow">←</span>
					{hub.avatar && <img className="hub-branded-avatar" src={hub.avatar} alt="" />}
					<span className="hub-branded-name">{hub.title}</span>
				</a>
			</div>
		</div>
	);
};

const CommunityCreate = (props: Props) => {
	const { hubData, templates = [], hubCommunities = [] } = props;
	const { loginData, locationData } = usePageContext();
	const altchaRef = useRef<import('components').AltchaRef>(null);
	const hubSlug = hubData?.slug || locationData?.query?.hub || null;
	const [subdomain, setSubdomain] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [heroLogo, setHeroLogo] = useState('');
	const [accentColorDark, setAccentColorDark] = useState('#2D2E2F');
	const [accentColorLight, setAccentColorLight] = useState('#FFFFFF');
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [createIsLoading, setCreateIsLoading] = useState(false);
	const [createError, setCreateError] = useState<string | undefined>(undefined);
	const [isCreated, setIsCreated] = useState(false);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
	const [cloneCommunityId, setCloneCommunityId] = useState<string | null>(null);

	const hasHub = !!hubData;
	const hubAccentDark = hubData?.accentColorDark || '#2D2E2F';

	const onCreateSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		setCreateIsLoading(true);
		if (!acceptTerms) return false;

		const formData = new FormData(evt.currentTarget);
		const honeypot = (formData.get('website') as string) ?? '';
		const payload = {
			subdomain,
			title,
			description,
			headerLogo: heroLogo,
			heroLogo,
			accentColorLight,
			accentColorDark,
			_honeypot: honeypot,
		};
		const altchaPayload = await altchaRef.current?.verify();
		if (!altchaPayload) {
			setCreateIsLoading(false);
			return;
		}

		const templateIdToUse = selectedTemplateId === CLONE_MARKER ? null : selectedTemplateId;

		try {
			await apiFetch.post<string>('/api/communities', {
				...payload,
				altcha: altchaPayload,
				...(hubSlug ? { hubSlug } : {}),
				...(templateIdToUse ? { templateId: templateIdToUse } : {}),
				...(selectedTemplateId === CLONE_MARKER && cloneCommunityId
					? { cloneCommunityId }
					: {}),
			});
			setCreateIsLoading(false);
			setIsCreated(true);
		} catch (error) {
			setCreateIsLoading(false);
			if (error instanceof Error) {
				setCreateError(error.message);
			} else if (typeof error === 'string') {
				setCreateError(error);
			} else {
				setCreateError('Error Creating Community');
			}
			return;
		}
	};
	const onSubdomainChange = (evt) => {
		setSubdomain(slugifyString(evt.target.value));
	};

	const onTitleChange = (evt) => {
		setTitle(evt.target.value);
	};

	const onDescriptionChange = (evt) => {
		setDescription(evt.target.value.substring(0, 280).replace(/\n/g, ' '));
	};

	const onHeroHeaderLogoChange = (val) => {
		setHeroLogo(val);
	};

	return (
		<div id="community-create-container" className={hasHub ? 'hub-branded' : ''}>
			{hasHub && <HubBrandedHeader hub={hubData!} />}
			<GridWrapper containerClassName={isCreated ? undefined : hasHub ? 'wide' : 'small'}>
				{!loginData.id && (
					<NonIdealState
						title="To create your community, create an account or login."
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; visual: string; action: Ele... Remove this comment to see the full error message
						visual="error"
						action={
							<a
								href={`/login?redirect=/community/create${hubSlug ? `?hub=${hubSlug}` : ''}`}
								className={Classes.BUTTON}
							>
								Login or Signup
							</a>
						}
					/>
				)}
				{loginData.id && isCreated && (
					<CommunityCreatedView subdomain={subdomain} hubName={hubData?.title} />
				)}
				{loginData.id && !isCreated && (
					<div className={hasHub ? 'hub-create-layout' : ''}>
						<div className={hasHub ? 'hub-create-left' : ''}>
							<h1>{hasHub ? <>Create a New Community</> : 'Create Community'}</h1>
							{hasHub && (
								<div
									className="hub-context-banner"
									style={{ borderLeftColor: hubAccentDark }}
								>
									{hubData!.avatar && (
										<img
											className="hub-context-avatar"
											src={hubData!.avatar}
											alt=""
										/>
									)}
									<div className="hub-context-text">
										<span className="hub-context-label">Creating within</span>
										<strong className="hub-context-name">
											{hubData!.title}
										</strong>
									</div>
								</div>
							)}
							{hasHub ? (
								<p>
									Communities created within a hub are automatically approved and
									publicly visible. Metadata about your community will be visible
									to hub managers. You can disconnect your community from the hub
									at any time. By creating this community, you agree to our{' '}
									<a href="/legal/terms">Terms of Service</a> and{' '}
									<a href="/legal/aup">Acceptable Use Policy</a>.
								</p>
							) : (
								<p>
									New communities are currently subject to approval for compliance
									with our <a href="/legal/terms">Terms of Service</a> and{' '}
									<a href="/legal/aup">Acceptable Use Policy</a>. Before approval,
									all features and functionality are available, but only logged in
									Members will be able to view the community. When you're ready
									for your community to be publicly visible, you can request
									approval from within the community.
								</p>
							)}
							{hasHub && (
								<TemplatePicker
									templates={templates}
									selectedTemplateId={selectedTemplateId}
									onSelect={setSelectedTemplateId}
									hubCommunities={hubCommunities}
									cloneEnabled={
										hubData?.communityCloneAccess !== 'off' &&
										hubCommunities.length > 0
									}
									cloneCommunityId={cloneCommunityId}
									onCloneCommunitySelect={setCloneCommunityId}
								/>
							)}
						</div>
						<div className={hasHub ? 'hub-create-right' : ''}>
							{hasHub && (
								<h2 className="hub-create-form-heading">Community Details</h2>
							)}
							<form onSubmit={onCreateSubmit}>
								<Honeypot name="website" />
								<InputField
									label="URL"
									isRequired={true}
									value={subdomain}
									onChange={onSubdomainChange}
									helperText={`https://${subdomain || '[URL]'}.pubpub.org`}
									error={
										createError
											? createError === 'URL already used'
												? 'URL already in use by another community'
												: 'Error Creating Community'
											: undefined
									}
								/>
								<InputField
									label="Title"
									isRequired={true}
									value={title}
									onChange={onTitleChange}
								/>
								<InputField
									label="Description"
									isTextarea={true}
									value={description}
									onChange={onDescriptionChange}
									helperText={`${description.length}/280 characters`}
								/>
								{selectedTemplateId ? (
									<Callout
										intent="none"
										icon="info-sign"
										style={{ marginBottom: 16 }}
									>
										{selectedTemplateId === CLONE_MARKER
											? 'The community logo and accent colors will be copied from the selected community.'
											: 'The community logo and accent colors will be set by the selected template.'}
									</Callout>
								) : (
									<>
										<ImageUpload
											htmlFor="large-header-logo-upload"
											label="Community Logo"
											defaultImage={heroLogo}
											height={60}
											width={150}
											onNewImage={onHeroHeaderLogoChange}
											helperText="Used on the landing page. Suggested height: 200px"
										/>
										<InputField label="Light Accent Color">
											<ColorInput
												value={accentColorLight}
												onChange={(val) => {
													setAccentColorLight(val.hex);
												}}
											/>
										</InputField>
										<InputField label="Dark Accent Color">
											<ColorInput
												value={accentColorDark}
												onChange={(val) => {
													setAccentColorDark(val.hex);
												}}
											/>
										</InputField>
									</>
								)}
								<InputField>
									<Checkbox
										checked={acceptTerms}
										onChange={() => {
											setAcceptTerms(!acceptTerms);
										}}
									>
										I have read and agree to the PubPub{' '}
										<a href="/legal/terms" target="_blank">
											Terms of Service
										</a>{' '}
										and{' '}
										<a href="/legal/privacy" target="_blank">
											Privacy Policy
										</a>
										.
									</Checkbox>
								</InputField>
								<Altcha ref={altchaRef} auto="onload" />
								<Button
									name="create"
									type="submit"
									className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY} create-account-button`}
									text="Create Community"
									disabled={
										!subdomain ||
										!title ||
										!acceptTerms ||
										(selectedTemplateId === CLONE_MARKER && !cloneCommunityId)
									}
									loading={createIsLoading}
								/>
								{createError && createError !== 'URL already used' && (
									<p className="error-message">{createError}</p>
								)}
							</form>
						</div>
					</div>
				)}
			</GridWrapper>
		</div>
	);
};

export default CommunityCreate;
