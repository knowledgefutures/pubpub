import type { Pub } from 'types';

import React from 'react';

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
		return <span dangerouslySetInnerHTML={{ __html: htmlTitle }} />;
	}

	return <>{title}</>;
};

export default PubTitle;
