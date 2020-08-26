import React, { useMemo } from 'react';

import { Icon } from 'components';

require('./pubEdgePlaceholderThumbnail.scss');

type OwnProps = {
	color: string;
	external?: boolean;
};

const defaultProps = {
	external: false,
};

type Props = OwnProps & typeof defaultProps;

function PubEdgePlaceholderThumbnail(props: Props) {
	const style = useMemo(() => ({ backgroundColor: props.color }), [props.color]);

	return (
		<div className="pub-edge-placeholder-thumbnail-component" style={style}>
			<Icon icon={props.external ? 'link' : 'pubDoc'} color="#ffffff" />
		</div>
	);
}
PubEdgePlaceholderThumbnail.defaultProps = defaultProps;
export default PubEdgePlaceholderThumbnail;
