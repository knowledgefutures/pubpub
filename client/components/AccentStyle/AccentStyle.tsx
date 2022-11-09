/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import Color from 'color';
import { Classes } from '@blueprintjs/core';

const {
	BUTTON,
	INTENT_PRIMARY,
	OUTLINED,
	ACTIVE,
	ICON,
	INTENT_DANGER,
	INTENT_WARNING,
	INTENT_SUCCESS,
	DISABLED,
	MINIMAL,
	TAG,
	TAB,
	DARK,
	SLIDER_HANDLE,
	SLIDER_PROGRESS,
	SLIDER_LABEL,
} = Classes;

const propTypes = {
	communityData: PropTypes.object.isRequired,
	isNavHidden: PropTypes.bool.isRequired,
};

const AccentStyle = function (props) {
	const { communityData, isNavHidden } = props;
	const { accentColorLight, accentColorDark, headerColorType, useHeaderTextAccent } =
		communityData;
	const generateColors = (inputColor) => {
		return {
			base: inputColor,
			text: Color(inputColor).isLight() ? '#000000' : '#FFFFFF',
			hover: Color(inputColor).fade(0.2).rgb().string(),
			action: Color(inputColor).fade(0.4).rgb().string(),
			minimal: Color(inputColor).fade(0.9).rgb().string(),
			minimalAction: Color(inputColor).fade(0.8).rgb().string(),
		};
	};
	const {
		base: baseColor,
		text: baseText,
		hover: baseHover,
		action: baseAction,
		minimal: baseMinimal,
		minimalAction: baseMinimalAction,
	} = generateColors(accentColorDark);

	const accentColorDarkFaded30 = Color(accentColorDark).whiten(0.5).rgb().string();
	const accentColorDarkFaded = Color(accentColorDark).fade(0.95).rgb().string();

	const headerAccentColor = generateColors(
		headerColorType === 'light' ? accentColorLight : accentColorDark,
	);
	const navAccentColor = headerColorType === 'light' ? accentColorDark : accentColorLight;
	const bottomBorder = `.accent-color.${
		isNavHidden ? 'header-component' : 'nav-bar-component'
	} { border-bottom: 2px solid ${navAccentColor}; }`;
	const simpleBottomBorder = `.accent-color.${
		isNavHidden ? 'header-component' : 'nav-bar-component'
	} { border-bottom: 1px solid #DDD; }`;
	const gradient = `linear-gradient(90deg, ${Color(headerAccentColor.base)
		.rgb()
		.fade(1)
		.string()} 0%,  ${Color(headerAccentColor.base).rgb().fade(1).string()} 85%,  ${
		headerAccentColor.base
	} 100%);`;

	return (
		<>
			<style type="text/css">
				{`:root { 
			--community-accent-dark: ${accentColorDark};
			--community-accent-dark-faded-30: ${accentColorDarkFaded30};
			--community-accent-dark-faded: ${accentColorDarkFaded};
		}`}
			</style>
			<style
				dangerouslySetInnerHTML={{
					__html: `
			.accent-background { background-color: ${baseColor}; }
			.accent-color { color: ${baseText}; }
			.accent-background.header-component, .accent-background.nav-bar-component, .accent-background.footer-component, .accent-background.nav-item-background, .accent-background.image-wrapper{ background-color: ${
				headerAccentColor.base
			}; }
			.accent-color.header-component, .accent-color.nav-bar-component, .accent-color.footer-component, .accent-color.nav-item { color: ${
				useHeaderTextAccent ? navAccentColor : headerAccentColor.text
			}; }
			.${BUTTON}.${INTENT_PRIMARY}:not(.${OUTLINED}) { background-color: ${baseAction}; color: ${baseText}; }
			.${BUTTON}.${INTENT_PRIMARY}:not(.${OUTLINED}):hover:not(.${DISABLED}) { background-color: ${baseHover}; color: ${baseText}; }
			.${BUTTON}.${INTENT_PRIMARY}:not(.${OUTLINED}):active:not(.${DISABLED}), .${BUTTON}.${INTENT_PRIMARY}.${ACTIVE}:not(.${DISABLED}) { background-color: ${baseColor}; color: ${baseText}; }

			.${BUTTON}.${INTENT_PRIMARY}.${OUTLINED} { border-color: ${baseColor}; color: ${baseColor}; }
			.${BUTTON}.${INTENT_PRIMARY}.${OUTLINED}:hover:not(.${DISABLED}) { background-color: ${baseMinimal}; color: ${baseColor}; }
			.${BUTTON}.${INTENT_PRIMARY}.${OUTLINED}:active:not(.${DISABLED}), .${BUTTON}.${INTENT_PRIMARY}.${ACTIVE}:not(.${DISABLED}) { background-color: ${baseMinimalAction}; color: ${baseColor}; }


			.${TAG}.${INTENT_PRIMARY} { background: ${baseColor}; color: ${baseText}; }
			.${TAG}.${MINIMAL}.${INTENT_PRIMARY} { background-color: ${baseMinimal}; color: inherit; }
			.accent-color .${BUTTON}:not([class*="${INTENT_PRIMARY}"]),
			.accent-color .${BUTTON}:not([class*="${INTENT_SUCCESS}"]),
			.accent-color .${BUTTON}:not([class*="${INTENT_WARNING}"]),
			.accent-color .${BUTTON}:not([class*="${INTENT_DANGER}"]),
			.accent-color .${BUTTON}[class*="${ICON}"]::before { color: inherit; }
			.accent-color a, .accent-color a:hover { color: inherit; }
			.${TAB}[aria-selected="true"], .${TAB}:not([aria-selected="true"]):hover { box-shadow: inset 0 -3px 0 ${baseMinimal}; }
			.${TAB}[aria-selected="true"] { box-shadow: inset 0 -3px 0 ${baseColor}; }
			.thread:hover:after { background-color: ${baseColor}; }
			.${SLIDER_PROGRESS}.${INTENT_PRIMARY}, .${DARK} .${SLIDER_PROGRESS}.${INTENT_PRIMARY} { background: ${baseColor}; }
			.${SLIDER_HANDLE} .${SLIDER_LABEL} { background: ${baseColor}; color: ${baseText}; }
			.highlight-dot-wrapper .highlight-dot { background-color: ${baseColor}; }

			.changelog-callout { background: ${baseMinimal} !important; }
			.changelog-callout .release-label { color: ${baseColor}; border: 1px dashed ${baseColor}; }

			span.citation:hover { color: ${baseColor}; }

			.overflow-gradient { background: ${gradient} }

			${useHeaderTextAccent ? bottomBorder : ''}
			${
				!useHeaderTextAccent &&
				headerAccentColor.base &&
				headerAccentColor.base.toLowerCase() === '#ffffff'
					? simpleBottomBorder
					: ''
			}
		`,
				}}
			/>
		</>
	);
};

// .pub-body-component sup.footnote { color: ${props.accentColor}; }
// .pub-body-component span.citation { color: ${props.accentColor}; }
// .highlight-background:before, .highlight-quote .highlight-text { background-color: ${props.accentMinimalColor}; }

AccentStyle.propTypes = propTypes;
export default AccentStyle;
