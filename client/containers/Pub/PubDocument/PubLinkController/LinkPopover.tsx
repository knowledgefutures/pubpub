import React, { useEffect, useRef } from 'react';
import Popper from 'popper.js';

import { ClickToCopyButton } from 'components';
import { getLowestAncestorWithId } from 'client/utils/dom';

export type HeaderPopoverProps = {
	locationData: any;
	element: any;
	mainContentRef: any;
};

const LinkPopover = (props: HeaderPopoverProps) => {
	const { element, mainContentRef, locationData } = props;
	const parent = getLowestAncestorWithId(element);
	const popoverRef = useRef();

	useEffect(() => {
		if (!parent) {
			return;
		}

		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
		const popperObject = new Popper(parent, popoverRef.current, {
			placement: parent.matches('h1, h2, h3, h4, h5, h6') ? 'left' : 'left-start',
		});

		return () => {
			popperObject.destroy();
		};
	}, [parent, mainContentRef]);

	return (
		<div
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
			ref={popoverRef}
			style={{ position: 'absolute', top: '-9999px' }}
			className="click-to-copy"
		>
			<ClickToCopyButton
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				copyString={`https://${locationData.hostname}${locationData.path}#${parent.id}`}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				beforeCopyPrompt="Copy link to this item"
			/>
		</div>
	);
};
export default LinkPopover;
