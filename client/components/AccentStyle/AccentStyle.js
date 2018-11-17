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
			.pt-button.pt-intent-primary { background-color: ${props.accentActionColor}; color: ${props.accentTextColor}; }
			.pt-button.pt-intent-primary:hover:not(.pt-disabled) { background-color: ${props.accentHoverColor}; color: ${props.accentTextColor}; }
			.pt-button.pt-intent-primary:active:not(.pt-disabled), .pt-button.pt-intent-primary.pt-active:not(.pt-disabled) { background-color: ${props.accentColor}; color: ${props.accentTextColor}; }
			.pt-tag.pt-intent-primary { background: ${props.accentColor}; color: ${props.accentTextColor}; }
			.pt-tag.pt-minimal.pt-intent-primary { background-color: ${props.accentMinimalColor}; color: inherit; }
			.accent-color .pt-button:not([class*="pt-intent-"]), .accent-color .pt-button[class*="pt-icon-"]::before { color: inherit; }
			.accent-color a, .accent-color a:hover { color: inherit; }
			.pt-tab[aria-selected="true"], .pt-tab:not([aria-selected="true"]):hover { box-shadow: inset 0 -3px 0 ${props.accentMinimalColor}; }
			.pt-tab[aria-selected="true"] { box-shadow: inset 0 -3px 0 ${props.accentColor}; }
			.thread:hover:after { background-color: ${props.accentColor}; }
			.pt-slider-progress, .pt-dark .pt-slider-progress { background: ${props.accentColor}; }
			.pt-slider-handle .pt-slider-label { background: ${props.accentColor}; color: ${props.accentTextColor}; }
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
