import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* html */
};

const LayoutHtml = function(props) {
	if (!props.content.html) { return null; }
	return (
		<div className="layout-html-component">
			<div className="block-content">
				<div className="container">
					<div className="row">
						<div className="col-12">
							<div dangerouslySetInnerHTML={{ __html: props.content.html }} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

LayoutHtml.propTypes = propTypes;
export default LayoutHtml;
