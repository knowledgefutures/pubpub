import React from 'react';

import { Pub } from 'types';
import { usePageContext } from 'utils/hooks';

type Props = {
	pubData: Pub;
	shouldUseHtmlTitle?: boolean;
};

const PubTitle = (props: Props) => {
	const {
		shouldUseHtmlTitle: providedShouldUseHtmlTitle,
		pubData: { title, htmlTitle },
	} = props;
	const { featureFlags } = usePageContext();
	const shouldUseHtmlTitle = providedShouldUseHtmlTitle || featureFlags.htmlPubHeaderValues;

	if (shouldUseHtmlTitle && htmlTitle) {
		// eslint-disable-next-line react/no-danger
		return <span dangerouslySetInnerHTML={{ __html: htmlTitle }} />;
	}

	return <>{title}</>;
};

export default PubTitle;
