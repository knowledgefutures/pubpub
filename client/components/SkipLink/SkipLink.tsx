import React from 'react';

import { TabToShow } from 'components';

require('./skipLink.scss');

type Props = {
	children: React.ReactNode;
	targetId: string;
};

const SkipLink = ({ targetId, children }: Props) => {
	// @ts-expect-error ts-migrate(2322) FIXME: Property 'className' does not exist on type 'Intri... Remove this comment to see the full error message
	return <TabToShow className="skip-link-component" href={`#${targetId}`} children={children} />;
};
export default SkipLink;
