import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'components';

require('./pubEdgePlaceholderThumbnail.scss');

const propTypes = {
	color: PropTypes.string.isRequired,
	external: PropTypes.bool,
};

const defaultProps = {
	external: false,
};

function PubEdgePlaceholderThumbnail(props) {
	const style = useMemo(() => ({ backgroundColor: props.color }), [props.color]);

	return (
		<div className="pub-edge-placeholder-thumbnail-component" style={style}>
			<Icon icon={props.external ? 'link' : 'pubDoc'} color="#ffffff" />
		</div>
	);
}

PubEdgePlaceholderThumbnail.propTypes = propTypes;
PubEdgePlaceholderThumbnail.defaultProps = defaultProps;
export default PubEdgePlaceholderThumbnail;
