import React from 'react';
import PropTypes from 'prop-types';
import Editor from '@pubpub/editor';
import { getResizedUrl } from 'utilities';

require('./layoutText.scss');

const propTypes = {
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* align, text */
};

const LayoutText = function(props) {
	if (!props.content.text) { return null; }
	const wrapperStyle = {
		textAlign: props.content.align || 'left',
	};
	return (
		<div className="layout-text-component">
			<div className="block-content">
				<div className="container">
					<div className="row">
						<div className="col-12">
							<div style={wrapperStyle}>
								<Editor
									nodeOptions={{
										image: {
											onResizeUrl: (url)=> { return getResizedUrl(url, 'fit-in', '1200x0'); },
										},
									}}
									initialContent={props.content.text || undefined}
									isReadOnly={true}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

LayoutText.propTypes = propTypes;
export default LayoutText;
