import React from 'react';
import PropTypes from 'prop-types';
import Editor from 'components/Editor';

import { GridWrapper } from 'components';
import { getResizedUrl } from 'utils/images';

const propTypes = {
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* align, text */
};

const LayoutText = function(props) {
	if (!props.content.text) {
		return null;
	}
	return (
		<div className="layout-text-component">
			<div className="block-content">
				<GridWrapper>
					<Editor
						nodeOptions={{
							image: {
								onResizeUrl: (url) => {
									return getResizedUrl(url, 'fit-in', '1200x0');
								},
								linkToSrc: false,
							},
						}}
						initialContent={props.content.text || undefined}
						isReadOnly={true}
					/>
				</GridWrapper>
			</div>
		</div>
	);
};

LayoutText.propTypes = propTypes;
export default LayoutText;
