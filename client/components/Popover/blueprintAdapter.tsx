import React from 'react';

import { Button as BlueprintButton } from '@blueprintjs/core';

const ButtonWithRef = React.forwardRef((props: any, ref: any) => {
	return <BlueprintButton {...props} elementRef={ref} />;
});

export const adaptDisclosureElementForBlueprintButton = (
	element: React.ReactElement,
	disclosureProps: any,
	active?: boolean,
) => {
	if (element.type === BlueprintButton) {
		return <ButtonWithRef {...element.props} {...disclosureProps} active={active} />;
	}
	return React.cloneElement(element, disclosureProps);
};
