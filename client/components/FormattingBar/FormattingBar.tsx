import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { usePageContext } from 'utils/hooks';
import { useRefMap } from 'client/utils/useRefMap';
import { usePubData } from 'client/containers/Pub/pubHooks';
import { indexByProperty } from 'utils/arrays';
import { Maybe } from 'utils/types';

import BlockTypeSelector from './BlockTypeSelector';
import FormattingBarButton from './FormattingBarButton';
import FormattingBarPopover from './FormattingBarPopover';
import { positionNearSelection } from './positioning';
import { FormattingBarButtonData } from './types';
import { getButtonPopoverComponent } from './utils';
import { usePendingAttrs } from './usePendingAttrs';

require('./formattingBar.scss');

type Props = {
	popoverContainerRef: any;
	editorChangeObject: {
		latestDomEvent?: any;
		insertFunctions?: any;
		menuItems?: {
			title: string;
			isActive: boolean;
			canRun: boolean;
			run: () => unknown;
		}[];
		view: EditorView;
		selectedNode?: Node;
		updateNode: (attrs: any) => unknown;
	};
	buttons: FormattingBarButtonData[];
	showBlockTypes?: boolean;
	isSmall?: boolean;
	isTranslucent?: boolean;
	isFullScreenWidth?: boolean;
	citationStyle?: string;
};

const useInteractionCount = (latestDomEvent: any) => {
	const key = useRef(-1);
	const previousDomEvent = useRef<any>(null);

	if (latestDomEvent) {
		const domEventsEqual =
			previousDomEvent.current &&
			previousDomEvent.current.type === latestDomEvent.type &&
			previousDomEvent.current.timeStamp === latestDomEvent.timeStamp;

		if (!domEventsEqual) {
			key.current += 1;
		}
		previousDomEvent.current = latestDomEvent;
	}

	return key.current;
};

const useControlsState = ({ buttons, editorChangeObject, popoverContainerRef }) => {
	const [openedButton, setOpenedButton] = useState<FormattingBarButtonData | null>(null);
	const interactionCount = useInteractionCount(editorChangeObject.latestDomEvent);
	const selectedNodeId = editorChangeObject.selectedNode?.attrs?.id;
	const effectKey = `${selectedNodeId}-${interactionCount}`;

	const indicatedButtons = buttons.filter(
		(button) => button.controls && button.controls.indicate(editorChangeObject),
	);

	const indicatedButtonsString = indicatedButtons.map((button) => button.key).join('-');

	const controlsComponent =
		openedButton &&
		openedButton?.controls.indicate(editorChangeObject) &&
		openedButton?.controls.show(editorChangeObject) &&
		openedButton?.controls.component;

	const controlsPosition =
		controlsComponent &&
		openedButton?.controls.position &&
		openedButton?.controls.position(editorChangeObject, popoverContainerRef);

	useEffect(() => {
		const openableIndicatedButton = indicatedButtons.find(
			(button) => button.controls && button.controls.trigger(editorChangeObject),
		);
		setOpenedButton(openableIndicatedButton);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [effectKey, indicatedButtonsString]);

	useEffect(() => {
		const options = { capture: true };
		const handler = (evt) => {
			if (evt.key === 'Enter') {
				if (indicatedButtons.length === 1 && !openedButton) {
					const [openableButton] = indicatedButtons;
					if (openableButton?.controls?.enterKeyTriggers) {
						evt.stopImmediatePropagation();
						evt.preventDefault();
						setOpenedButton(openableButton);
					}
				}
			}
		};
		document.addEventListener('keydown', handler, options);
		return () => document.removeEventListener('keydown', handler, options);
	}, [indicatedButtons, openedButton, setOpenedButton]);

	return {
		indicatedButtons,
		openedButton,
		setOpenedButton,
		controlsPosition,
		selectedNodeId,
		ControlsComponent: controlsComponent,
	};
};

const FormattingBar = (props: Props) => {
	const {
		buttons,
		editorChangeObject,
		popoverContainerRef,
		showBlockTypes = true,
		isSmall = false,
		isTranslucent = false,
		isFullScreenWidth = false,
		citationStyle = 'apa',
	} = props;
	const { menuItems, insertFunctions, view, selectedNode, updateNode } = editorChangeObject;
	const { communityData } = usePageContext();
	const pubData = usePubData();
	const buttonElementRefs = useRefMap();
	const toolbar = useToolbarState({ loop: true });
	const pendingAttrs = usePendingAttrs({
		selectedNode,
		updateNode,
		editorView: editorChangeObject.view,
	});
	const menuItemsByKey: Maybe<Record<string, any>> = useMemo(
		() => menuItems && indexByProperty(menuItems, 'title'),
		[menuItems],
	);
	const {
		indicatedButtons,
		openedButton,
		setOpenedButton,
		controlsPosition,
		selectedNodeId,
		ControlsComponent,
	} = useControlsState(props);

	const handleButtonClick = (item) => {
		if (indicatedButtons.includes(item)) {
			setOpenedButton(openedButton === item ? null : item);
		} else {
			const insertFunction = insertFunctions[item.key];
			const menuItem = menuItemsByKey?.[item.key];
			if (insertFunction) {
				insertFunction();
				view.focus();
			} else if (menuItem) {
				menuItem.run();
				view.focus();
			}
		}
	};

	useEffect(() => {
		if (openedButton) {
			const ref = buttonElementRefs.getRef(openedButton.key);
			if (ref && ref.current && typeof ref.current.scrollIntoView === 'function') {
				const buttonElement = ref.current;
				const paddingPx = 5;
				buttonElement.parentNode.scrollLeft = buttonElement.offsetLeft - paddingPx;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openedButton]);

	const renderButton = (button: FormattingBarButtonData) => {
		const matchingMenuItem = menuItemsByKey?.[button.key];
		const insertFunction = insertFunctions && insertFunctions[button.key];
		const noFunction = !insertFunction && matchingMenuItem && !matchingMenuItem.canRun;
		const isOpen = openedButton === button;
		const isIndicated = indicatedButtons.includes(button) && !isOpen;
		const isActive = !isOpen && !isIndicated && !!matchingMenuItem && matchingMenuItem.isActive;
		const isDisabled = Boolean(
			(typeof button.isDisabled === 'function' && button.isDisabled(pubData)) ||
				noFunction ||
				(openedButton && !isOpen && !isIndicated && !controlsPosition),
		);
		const maybeEditorChangeObject = button.key === 'media' ? { editorChangeObject } : {};
		const PopoverComponent = getButtonPopoverComponent(button, isDisabled);

		return (
			<ToolbarItem
				{...toolbar}
				outerRef={buttonElementRefs.getRef(button.key)}
				as={button.component || FormattingBarButton}
				key={button.key}
				formattingItem={button}
				disabled={isDisabled}
				isActive={isActive}
				isIndicated={isIndicated && !isOpen}
				isOpen={isOpen}
				isDetached={isOpen && !!controlsPosition}
				isSmall={isSmall}
				popoverContent={PopoverComponent && <PopoverComponent />}
				accentColor={communityData.accentColorDark}
				onClick={() => handleButtonClick(button)}
				{...maybeEditorChangeObject}
			/>
		);
	};

	return (
		<div
			className={classNames(
				'formatting-bar-component',
				isSmall && 'small',
				isTranslucent && 'translucent',
			)}
		>
			<Toolbar aria-label="Formatting toolbar" className="toolbar" {...toolbar}>
				{showBlockTypes && (
					<React.Fragment>
						<ToolbarItem
							as={BlockTypeSelector}
							isSmall={isSmall}
							editorChangeObject={editorChangeObject}
							{...toolbar}
						/>
						<div className="separator" />
					</React.Fragment>
				)}
				{buttons.map(renderButton)}
			</Toolbar>
			{ControlsComponent && (
				<FormattingBarPopover
					editorChangeObject={editorChangeObject}
					accentColor={communityData.accentColorDark}
					button={openedButton}
					isFullScreenWidth={isFullScreenWidth}
					containerRef={popoverContainerRef}
					floatingPosition={
						isFullScreenWidth
							? controlsPosition
							: controlsPosition || positionNearSelection
					}
					captureFocusOnMount={openedButton?.controls?.captureFocusOnMount}
					showCloseButton={openedButton?.controls?.showCloseButton}
					onClose={() => setOpenedButton(null)}
				>
					<ControlsComponent
						key={selectedNodeId}
						editorChangeObject={editorChangeObject}
						isSmall={isSmall}
						citationStyle={citationStyle}
						pubData={pubData}
						pendingAttrs={pendingAttrs}
						onClose={() => setOpenedButton(null)}
					/>
				</FormattingBarPopover>
			)}
		</div>
	);
};

export default FormattingBar;
