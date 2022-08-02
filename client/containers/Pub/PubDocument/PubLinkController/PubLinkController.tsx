import React, { useEffect, useReducer } from 'react';

import { getHighestAncestorWithId } from 'client/utils/dom';

import LinkPopover from './LinkPopover';

type Props = {
	mainContentRef: React.MutableRefObject<null | HTMLDivElement>;
};

const clickToCopySelector = '.click-to-copy, .click-to-copy *';

enum HoverTargetTypes {
	ClickToCopy = 'click-to-copy',
}

type PubLinkControllerState = {
	[hoverTargetType: string]: Element | undefined;
};

type PubMouseEventAction = {
	type: string;
	element?: Element;
};

function isValidLinkTarget(element: Element | null): element is Element {
	if (!element) {
		return false;
	}

	if (element.tagName === 'P' && element.textContent === '') {
		return false;
	}

	return true;
}

const PubLinkController = (props: Props) => {
	const { mainContentRef } = props;
	const [hoverTargets, hoverElemsDispatch] = useReducer(
		(state: PubLinkControllerState, action: PubMouseEventAction) => {
			return {
				...state,
				[action.type]: action.element,
			};
		},
		{},
	);

	useEffect(() => {
		let timeout: any;

		const handleMouseOver = (e: MouseEvent) => {
			const element = e.target as Element | null;

			if (!element) {
				return;
			}

			const parent = getHighestAncestorWithId(
				element,
				document.querySelector('.pub-body-component > .editor')!,
			);

			if (isValidLinkTarget(parent)) {
				hoverElemsDispatch({ type: HoverTargetTypes.ClickToCopy, element: parent });
				clearTimeout(timeout);
			} else if (element.matches(clickToCopySelector)) {
				clearTimeout(timeout);
			}
		};
		const handleMouseOut = (e: MouseEvent) => {
			const element = e.target as Element | null;

			if (!element) {
				return;
			}

			const parent = getHighestAncestorWithId(
				element,
				document.querySelector('.pub-body-component > .editor')!,
			);

			if (isValidLinkTarget(parent) || element.matches(clickToCopySelector)) {
				timeout = setTimeout(() => {
					hoverElemsDispatch({ type: HoverTargetTypes.ClickToCopy });
				}, 250);
			}
		};

		document.addEventListener('mouseover', handleMouseOver);
		document.addEventListener('mouseout', handleMouseOut);

		return () => {
			document.removeEventListener('mouseover', handleMouseOver);
			document.removeEventListener('mouseout', handleMouseOut);
		};
	}, []);

	const clickToCopyTarget = hoverTargets[HoverTargetTypes.ClickToCopy];

	return (
		<div className="pub-link-controller-component">
			{clickToCopyTarget && (
				<LinkPopover element={clickToCopyTarget} mainContentRef={mainContentRef} />
			)}
		</div>
	);
};

export default PubLinkController;
