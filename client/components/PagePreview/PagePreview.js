import React from 'react';
import PropTypes from 'prop-types';

import { getResizedUrl } from 'utils/images';
import { generatePageBackground } from 'utils/pages';

require('./pagePreview.scss');

const propTypes = {
	pageData: PropTypes.object.isRequired,
};

const PagePreview = function(props) {
	const pageData = props.pageData;

	const resizedBannerImage = getResizedUrl(pageData.avatar, 'fit-in', '600x0');
	const bannerStyle = pageData.avatar
		? { backgroundImage: `url("${resizedBannerImage}")` }
		: { background: generatePageBackground(pageData.title) };

	return (
		<a className="page-preview-component" style={bannerStyle} href={`/${pageData.slug}`}>
			{pageData.avatar && <div className="dim" />}
			<span>{pageData.title}</span>
		</a>
	);
};

PagePreview.propTypes = propTypes;
export default PagePreview;
