import React from 'react';

import PropTypes from 'prop-types';

import { GridWrapper } from 'components';
import { normalizeResizeUrlsInHtml } from 'utils/images';

const propTypes = {
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* html */
};

const LayoutHtml = function (props) {
	if (!props.content.html) {
		return null;
	}
	const normalizedHtml = normalizeResizeUrlsInHtml(props.content.html);
	return (
		<div className="layout-html-component">
			<div className="block-content">
				<GridWrapper>
					<div dangerouslySetInnerHTML={{ __html: normalizedHtml }} />
				</GridWrapper>
			</div>
		</div>
	);
};

LayoutHtml.propTypes = propTypes;
export default LayoutHtml;
