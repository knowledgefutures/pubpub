/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	accentColor: PropTypes.string.isRequired, // Primary accent color
	accentTextColor: PropTypes.string.isRequired, // Text color that looks good on primary
	accentActionColor: PropTypes.string.isRequired, // Background color for buttons
	accentHoverColor: PropTypes.string.isRequired,
	accentMinimalColor: PropTypes.string.isRequired, // Opacity 15% color for tags, etc
};

const AccentStyle = function(props) {
	return (
		<style dangerouslySetInnerHTML={{ __html: `
			.accent-background { background-color: ${props.accentColor}; } 
			.accent-color { color: ${props.accentTextColor}; }
			.bp3-button.bp3-intent-primary { background-color: ${props.accentActionColor}; color: ${props.accentTextColor}; }
			.bp3-button.bp3-intent-primary:hover:not(.bp3-disabled) { background-color: ${props.accentHoverColor}; color: ${props.accentTextColor}; }
			.bp3-button.bp3-intent-primary:active:not(.bp3-disabled), .bp3-button.bp3-intent-primary.bp3-active:not(.bp3-disabled) { background-color: ${props.accentColor}; color: ${props.accentTextColor}; }
			.bp3-tag.bp3-intent-primary { background: ${props.accentColor}; color: ${props.accentTextColor}; }
			.bp3-tag.bp3-minimal.bp3-intent-primary { background-color: ${props.accentMinimalColor}; color: inherit; }
			.accent-color .bp3-button:not([class*="bp3-intent-"]), .accent-color .bp3-button[class*="bp3-icon-"]::before { color: inherit; }
			.accent-color a, .accent-color a:hover { color: inherit; }
			.bp3-tab[aria-selected="true"], .bp3-tab:not([aria-selected="true"]):hover { box-shadow: inset 0 -3px 0 ${props.accentMinimalColor}; }
			.bp3-tab[aria-selected="true"] { box-shadow: inset 0 -3px 0 ${props.accentColor}; }
			.thread:hover:after { background-color: ${props.accentColor}; }
			.bp3-slider-progress, .bp3-dark .bp3-slider-progress { background: ${props.accentColor}; }
			.bp3-slider-handle .bp3-slider-label { background: ${props.accentColor}; color: ${props.accentTextColor}; }
			.footnote-text a { text-decoration: underline; }
			.highlight-dot-wrapper .highlight-dot { background-color: ${props.accentColor}; }
		` }}
		/>
	);
};

// .pub-body-component sup.footnote { color: ${props.accentColor}; }
// .pub-body-component span.citation { color: ${props.accentColor}; }
// .highlight-background:before, .highlight-quote .highlight-text { background-color: ${props.accentMinimalColor}; }

AccentStyle.propTypes = propTypes;
export default AccentStyle;
