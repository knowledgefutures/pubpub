import React from 'react';

import { Tag } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';

type Props = {
	className?: string;
};

/**
 * Marks a setting that is only visible or editable to superadmins, so it stays
 * obvious which options regular community admins can't see or use yet. Place
 * next to the label of any superadmin-gated field or section. Renders nothing
 * for non-superadmins, so it's safe on sections that some admins can also see
 * (e.g. a configured Underlay integration).
 */
const SuperAdminTag = (props: Props) => {
	const { loginData } = usePageContext();
	if (!loginData.isSuperAdmin) {
		return null;
	}
	return (
		<Tag className={props.className} minimal intent="danger" icon="crown">
			Superadmin only
		</Tag>
	);
};

export default SuperAdminTag;
