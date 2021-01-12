import React, { useEffect, useRef } from 'react';
import Popper from 'popper.js';

import { ClickToCopyButton } from 'components';
import { getLowestAncestorWithId } from 'client/utils/dom';
import { usePageContext } from 'utils/hooks';

import { usePubData } from '../../pubHooks';

export type HeaderPopoverProps = {
	locationData: any;
	element: any;
	mainContentRef: any;
};

const LinkPopover = (props: HeaderPopoverProps) => {
	const { element, mainContentRef, locationData } = props;
	const parent = getLowestAncestorWithId(element);
	const popoverRef = useRef<null | HTMLDivElement>(null);
	const pubData = usePubData();
	const {
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();

	useEffect(() => {
		const popover = popoverRef.current;
		if (parent && popover) {
			const popperObject = new Popper(parent, popover, {
				placement: parent.matches('h1, h2, h3, h4, h5, h6') ? 'left' : 'left-start',
			});

			return () => {
				popperObject.destroy();
			};
		}
		return () => {};
	}, [parent, mainContentRef]);

	// The prosemirror-reactive plugin will generate random, transient IDs starting with 'r'
	const unstableLink = Boolean(parent && /^r[0-9]*$/.test(parent.id));
	const isLatestRelease = pubData.releaseNumber === pubData.releases.length;
	const managersEnableLinksPrompt =
		pubData.isReadOnly && isLatestRelease && unstableLink && canManage
			? 'You must create a new Release to link to this block.'
			: '';

	const shown = !unstableLink || managersEnableLinksPrompt;

	if (shown) {
		return (
			<div
				ref={popoverRef}
				style={{ position: 'absolute', top: '-9999px' }}
				className="click-to-copy"
			>
				<ClickToCopyButton
					copyString={`https://${locationData.hostname}${locationData.path}#${parent?.id}`}
					beforeCopyPrompt={managersEnableLinksPrompt}
					disabled={unstableLink}
				/>
			</div>
		);
	}
	return null;
};
export default LinkPopover;
