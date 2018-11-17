import React from 'react';
import PropTypes from 'prop-types';
import { getResizedUrl } from 'utilities';

require('./communityPreview.scss');

const propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	subdomain: PropTypes.string,
	domain: PropTypes.string,
	largeHeaderLogo: PropTypes.string,
	largeHeaderBackground: PropTypes.string,
	accentColor: PropTypes.string,
	accentTextColor: PropTypes.string
};

const defaultProps = {
	title: undefined,
	description: undefined,
	subdomain: undefined,
	domain: undefined,
	largeHeaderLogo: undefined,
	largeHeaderBackground: undefined,
	accentColor: '#000',
	accentTextColor: '#FFF',
};

const CommunityPreview = function(props) {
	const resizedHeaderLogo = getResizedUrl(props.largeHeaderLogo, 'fit-in', '600x0');
	const resizedHeaderBackground = getResizedUrl(props.largeHeaderBackground, 'fit-in', '800x0');
	const logoStyle = { color: props.accentTextColor };
	const backgroundStyle = {
		backgroundColor: props.accentColor,
		color: props.accentTextColor,
		backgroundImage: props.largeHeaderBackground ? `url("${resizedHeaderBackground}")` : '',
	};
	const communityUrl = props.domain ? `https://${props.domain}` : `https://${props.subdomain}.pubpub.org`;
	return (
		<a className="community-preview-component" href={communityUrl} style={backgroundStyle}>
			<div className="logo-wrapper">
				{props.largeHeaderLogo &&
					<img className="logo" src={resizedHeaderLogo} alt={props.title} />
				}
				{!props.largeHeaderLogo &&
					<h3 style={logoStyle}>{props.title}</h3>
				}
			</div>
			<div className="description">{props.description}</div>
		</a>
	);
};

CommunityPreview.defaultProps = defaultProps;
CommunityPreview.propTypes = propTypes;
export default CommunityPreview;
