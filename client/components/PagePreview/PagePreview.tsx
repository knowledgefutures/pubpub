import React from 'react';

import { getResizedUrl } from 'utils/images';
import { generatePageBackground } from 'utils/pages';

require('./pagePreview.scss');

type Props = {
	pageData: {
		title: string;
		slug: string;
		avatar?: string;
	};
};

const PagePreview = (props: Props) => {
	const pageData = props.pageData;

	const resizedBannerImage = getResizedUrl(pageData.avatar, 'inside', 600);
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

export default PagePreview;
