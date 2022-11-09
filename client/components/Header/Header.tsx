import React from 'react';
import classNames from 'classnames';
import { AnchorButton, Classes, Intent } from '@blueprintjs/core';

import { CommunityHeroButton } from 'types';
import { GridWrapper, GlobalControls } from 'components';
import { usePageContext } from 'utils/hooks';
import { getResizedUrl } from 'utils/images';

require('./header.scss');

type OwnProps = {
	previewContext?: any;
};

const defaultProps = {
	previewContext: undefined,
};

type Props = OwnProps & typeof defaultProps;

const Header = (props: Props) => {
	const { locationData, communityData, loginData } = usePageContext(props.previewContext);

	const calculateComponentClasses = (hideHero) => {
		let dynamicComponentClasses = '';

		const isLanding = locationData.path === '/';
		const isBasePubPub = locationData.isBasePubPub;
		const backgroundColorChange =
			communityData.heroBackgroundColor &&
			communityData.accentColorDark !== communityData.heroBackgroundColor;
		const textColorChange =
			communityData.heroTextColor &&
			communityData.accentTextColor !== communityData.heroTextColor;

		if ((!isBasePubPub && !backgroundColorChange) || !isLanding) {
			dynamicComponentClasses += ' accent-background';
		}
		if ((!isBasePubPub && !textColorChange) || (!isBasePubPub && !isLanding)) {
			dynamicComponentClasses += ' accent-color';
		}
		if (hideHero) {
			return dynamicComponentClasses;
		}
		const heroTextColor = communityData.heroTextColor || communityData.accentTextColor;
		if (heroTextColor === '#FFFFFF') {
			dynamicComponentClasses += ` ${Classes.DARK}`;
		}
		return dynamicComponentClasses;
	};

	const calculateMainClasses = (hideHero) => {
		let dynamicMainClasses = 'main';
		if (hideHero) {
			return dynamicMainClasses;
		}
		if (
			!communityData.hideHero &&
			communityData.useHeaderGradient &&
			communityData.heroBackgroundImage
		) {
			dynamicMainClasses += ` gradient ${Classes.DARK}`;
		}
		return dynamicMainClasses;
	};

	const calculateHeroClasses = (hideHero) => {
		let dynamicHeroClasses = 'hero';
		if (hideHero) {
			return dynamicHeroClasses;
		}
		if (communityData.heroAlign === 'center') {
			dynamicHeroClasses += ' centered';
		}
		return dynamicHeroClasses;
	};

	const calculateBackgroundStyle = (hideHero) => {
		const backgroundStyle = {};
		if (locationData.isBasePubPub) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'boxShadow' does not exist on type '{}'.
			backgroundStyle.boxShadow =
				locationData.path === '/'
					? ''
					: '0 0 0 1px rgba(16, 22, 26, 0.1), 0 0 0 rgba(16, 22, 26, 0), 0 1px 1px rgba(16, 22, 26, 0.2)';
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundColor' does not exist on type ... Remove this comment to see the full error message
			backgroundStyle.backgroundColor = locationData.path === '/' ? '' : '#f7f7f9';
		}

		if (hideHero) {
			return backgroundStyle;
		}

		if (communityData.heroBackgroundImage) {
			const resizedBackgroundImage = getResizedUrl(
				communityData.heroBackgroundImage,
				'outside',
				1500,
				600,
			);
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundImage' does not exist on type ... Remove this comment to see the full error message
			backgroundStyle.backgroundImage = `url("${resizedBackgroundImage}")`;
		}
		const heroBackgroundColor =
			communityData.heroBackgroundColor || communityData.accentColorDark;
		if (heroBackgroundColor) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundColor' does not exist on type ... Remove this comment to see the full error message
			backgroundStyle.backgroundColor = communityData.heroBackgroundColor;
		}

		return backgroundStyle;
	};

	const hideHero = locationData.path !== '/' || communityData.hideHero;
	const hideHeaderLogo = !hideHero && communityData.hideHeaderLogo;
	const componentClasses = calculateComponentClasses(hideHero);
	const mainClasses = calculateMainClasses(hideHero);
	const heroClasses = calculateHeroClasses(hideHero);
	const backgroundStyle = calculateBackgroundStyle(hideHero);

	const loggedIn = !!loginData.slug;
	const isBasePubPub = locationData.isBasePubPub;

	const resizedHeaderLogo = getResizedUrl(communityData.headerLogo, 'inside', undefined, 50);
	const resizedHeroLogo = getResizedUrl(communityData.heroLogo, 'inside', undefined, 200);
	const resizedHeroImage = getResizedUrl(communityData.heroImage, 'inside', 600);
	const heroPrimaryButton: Partial<CommunityHeroButton> = communityData.heroPrimaryButton || {};
	const heroSecondaryButton: Partial<CommunityHeroButton> =
		communityData.heroSecondaryButton || {};
	const isPreview = !!props.previewContext;

	return (
		<header
			className={classNames([
				'header-component',
				componentClasses,
				isPreview ? 'preview' : '',
			])}
			style={backgroundStyle}
		>
			<div className={mainClasses}>
				<GridWrapper columnClassName="main-content">
					<div className="logo-wrapper">
						{!hideHeaderLogo && (
							<a href="/" aria-label={communityData.title}>
								{communityData.headerLogo && (
									<React.Fragment>
										<img
											alt=""
											style={isBasePubPub ? { padding: '1px 0px' } : {}}
											src={resizedHeaderLogo}
										/>
									</React.Fragment>
								)}
								{!communityData.headerLogo && <span>{communityData.title}</span>}
							</a>
						)}
					</div>
					<GlobalControls isBasePubPub={locationData.isBasePubPub} loggedIn={loggedIn} />
				</GridWrapper>
			</div>
			{!hideHero && (
				<div className={heroClasses}>
					<GridWrapper columnClassName="hero-content">
						<div className="hero-copy">
							{communityData.heroLogo && (
								<div className="hero-logo">
									<img alt={communityData.title} src={resizedHeroLogo} />
								</div>
							)}
							{communityData.heroTitle && (
								<div className="hero-title">{communityData.heroTitle}</div>
							)}
							{communityData.heroText && (
								<div className="hero-text">{communityData.heroText}</div>
							)}
							<div className="hero-button">
								{heroPrimaryButton.title && (
									<AnchorButton
										intent={Intent.PRIMARY}
										large={true}
										text={heroPrimaryButton.title}
										href={heroPrimaryButton.url}
									/>
								)}
								{heroSecondaryButton.title && (
									<AnchorButton
										large={true}
										minimal={true}
										text={heroSecondaryButton.title}
										href={heroSecondaryButton.url}
									/>
								)}
							</div>
						</div>
						{communityData.heroImage && (
							<div className="hero-image">
								<img alt="Community banner" src={resizedHeroImage} />
							</div>
						)}
					</GridWrapper>
				</div>
			)}
		</header>
	);
};
Header.defaultProps = defaultProps;
export default Header;
