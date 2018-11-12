import React from 'react';
import PropTypes from 'prop-types';

require('./layoutHtml.scss');

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
					{/* props.content.title &&
						<div className="row">
							<div className="col-12">
								<h2 className="block-title">{props.content.title}</h2>
							</div>
						</div>
					*/}
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
