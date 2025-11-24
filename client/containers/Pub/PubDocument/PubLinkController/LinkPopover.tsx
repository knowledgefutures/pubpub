import React, { useEffect, useRef } from 'react';

import { createPopper } from '@popperjs/core';

import { getLowestAncestorWithId } from 'client/utils/dom';
import { ClickToCopyButton } from 'components';
import { expect } from 'utils/assert';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';

import { usePubContext } from '../../pubHooks';

type Props = {
	element: Element;
	mainContentRef: React.MutableRefObject<null | HTMLDivElement>;
};

const LinkPopover = (props: Props) => {
	const { element, mainContentRef } = props;
	const parent = getLowestAncestorWithId(element);
	const popoverRef = useRef<null | HTMLDivElement>(null);
	const { pubData, pubBodyState } = usePubContext();
	const {
		communityData,
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();

	useEffect(() => {
		const popover = popoverRef.current;
		if (parent && popover) {
			const popperObject = createPopper(parent, popover, {
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
	const isLatestRelease = pubData.releaseNumber === expect(pubData.releases).length;
	const managersEnableLinksPrompt =
		pubBodyState.isReadOnly && isLatestRelease && unstableLink && canManage
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
					copyString={pubUrl(communityData, pubData, { hash: parent?.id })}
					beforeCopyPrompt={managersEnableLinksPrompt}
					disabled={unstableLink}
				/>
			</div>
		);
	}
	return null;
};
export default LinkPopover;
