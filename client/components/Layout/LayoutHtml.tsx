/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

import { GridWrapper } from 'components';

const propTypes = {
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* html */
};

const LayoutHtml = function(props) {
	if (!props.content.html) {
		return null;
	}
	return (
		<div className="layout-html-component">
			<div className="block-content">
				<GridWrapper>
					<div dangerouslySetInnerHTML={{ __html: props.content.html }} />
				</GridWrapper>
			</div>
		</div>
	);
};

LayoutHtml.propTypes = propTypes;
export default LayoutHtml;
