import React, { useEffect, useRef, useState, useCallback } from 'react';
import classNames from 'classnames';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';

import { usePageContext } from 'utils/hooks';
import { useRefMap } from 'client/utils/useRefMap';
import { usePubData } from 'client/containers/Pub/pubHooks';

import BlockTypeSelector from './BlockTypeSelector';
import FormattingBarButton from './FormattingBarButton';
import FormattingBarPopover from './FormattingBarPopover';
import { positionNearSelection } from './positioning';
import { FormattingBarButtonData } from './types';
import { getButtonPopoverComponent } from './utils';

require('./formattingBar.scss');

type OwnProps = {
	popoverContainerRef: any;
	editorChangeObject: {
		latestDomEvent?: any;
		insertFunctions?: any;
		menuItems?: {}[];
		view?: {
			focus?: (...args: any[]) => any;
		};
		selectedNode?: {
			attrs?: any;
		};
	};
	buttons: FormattingBarButtonData[];
	showBlockTypes?: boolean;
	isSmall?: boolean;
	isTranslucent?: boolean;
	isFullScreenWidth?: boolean;
	citationStyle?: string;
};

const defaultProps = {
	showBlockTypes: true,
	isTranslucent: false,
	isSmall: false,
	isFullScreenWidth: false,
	citationStyle: 'apa',
};

const useControlsKey = (latestDomEvent) => {
	const key = useRef(-1);
	const previousDomEvent = useRef(null);

	if (latestDomEvent) {
		const domEventsEqual =
			previousDomEvent.current &&
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			previousDomEvent.current.type === latestDomEvent.type &&
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			previousDomEvent.current.timeStamp === latestDomEvent.timeStamp;

		if (!domEventsEqual) {
			key.current += 1;
		}
		previousDomEvent.current = latestDomEvent;
	}

	return key.current;
};

const useControlsState = ({ buttons, editorChangeObject, popoverContainerRef }) => {
	const [openedButton, setOpenedButton] = useState(null);
	const firstRenderRef = useRef(true);
	const controlsKey = useControlsKey(editorChangeObject.latestDomEvent);

	const indicatedButtons = buttons.filter(
		(button) => button.controls && button.controls.indicate(editorChangeObject),
	);

	const indicatedButtonsString = indicatedButtons.map((button) => button.key).join('-');

	const controlsComponent =
		openedButton &&
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		openedButton.controls.show(editorChangeObject) &&
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		openedButton.controls.component;

	const controlsPosition =
		controlsComponent &&
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		openedButton.controls.position &&
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		openedButton.controls.position(editorChangeObject, popoverContainerRef);

	useEffect(() => {
		const openableIndicatedButton = indicatedButtons.find(
			(button) => button.controls && button.controls.trigger(editorChangeObject),
		);
		setOpenedButton(openableIndicatedButton);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controlsKey, indicatedButtonsString]);

	firstRenderRef.current = false;

	return {
		indicatedButtons: indicatedButtons,
		openedButton: openedButton,
		setOpenedButton: setOpenedButton,
		controlsPosition: controlsPosition,
		ControlsComponent: controlsComponent,
	};
};

type Props = OwnProps & typeof defaultProps;

const FormattingBar = (props: Props) => {
	const {
		buttons,
		editorChangeObject,
		popoverContainerRef,
		showBlockTypes,
		isSmall,
		isTranslucent,
		isFullScreenWidth,
		citationStyle,
	} = props;
	const { menuItems, insertFunctions, view } = editorChangeObject;
	const { communityData } = usePageContext();
	const pubData = usePubData();
	const buttonElementRefs = useRefMap();
	const toolbar = useToolbarState({ loop: true });
	const {
		indicatedButtons,
		openedButton,
		setOpenedButton,
		controlsPosition,
		ControlsComponent,
	} = useControlsState(props);

	const menuItemByKey = (key) => {
		if (menuItems) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type '{}'.
			return menuItems.find((menuItem) => menuItem.title === key);
		}
		return null;
	};

	const handleButtonClick = (item) => {
		if (indicatedButtons.includes(item)) {
			setOpenedButton(openedButton === item ? null : item);
		} else {
			const insertFunction = insertFunctions[item.key];
			const menuItem = menuItemByKey(item.key);
			if (insertFunction) {
				insertFunction();
				// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
				view.focus();
			} else if (menuItem) {
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'run' does not exist on type '{}'.
				menuItem.run();
				// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
				view.focus();
			}
		}
	};

	useEffect(() => {
		const options = { capture: true };
		const handler = (evt) => {
			if (evt.key === 'Enter') {
				if (indicatedButtons.length === 1 && !openedButton) {
					const [openableButton] = indicatedButtons;
					if (
						openableButton &&
						openableButton.controls &&
						openableButton.controls.enterKeyTriggers
					) {
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

	useEffect(() => {
		if (openedButton) {
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			const ref = buttonElementRefs.get(openedButton.key);
			if (ref && ref.current && typeof ref.current.scrollIntoView === 'function') {
				const buttonElement = ref.current;
				const paddingPx = 5;
				buttonElement.parentNode.scrollLeft = buttonElement.offsetLeft - paddingPx;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openedButton]);

	const handlePopoverClose = useCallback(() => {
		setOpenedButton(null);
	}, [setOpenedButton]);

	const renderButton = (button: FormattingBarButtonData) => {
		const matchingMenuItem = menuItemByKey(button.key);
		const insertFunction = insertFunctions && insertFunctions[button.key];
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'canRun' does not exist on type '{}'.
		const noFunction = !insertFunction && matchingMenuItem && !matchingMenuItem.canRun;
		const isOpen = openedButton === button;
		const isIndicated = indicatedButtons.includes(button) && !isOpen;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isActive' does not exist on type '{}'.
		const isActive = !isOpen && !isIndicated && !!matchingMenuItem && matchingMenuItem.isActive;
		const isDisabled = Boolean(
			(typeof button.isDisabled === 'function' && button.isDisabled(pubData)) ||
				noFunction ||
				(openedButton && !isOpen && !isIndicated && !controlsPosition),
		);
		const maybeEditorChangeObject =
			button.key === 'media' ? { editorChangeObject: editorChangeObject } : {};
		const PopoverComponent = getButtonPopoverComponent(button, isDisabled);

		return (
			<ToolbarItem
				{...toolbar}
				outerRef={buttonElementRefs.get(button.key)}
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
				// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
				onClick={(evt) => handleButtonClick(button, evt)}
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
						{/* @ts-expect-error ts-migrate(2769) FIXME: Type 'ForwardRefExoticComponent<RefAttributes<unkn... Remove this comment to see the full error message */}
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
					onClose={handlePopoverClose}
					isFullScreenWidth={isFullScreenWidth}
					containerRef={popoverContainerRef}
					floatingPosition={
						isFullScreenWidth
							? controlsPosition
							: controlsPosition || positionNearSelection
					}
					captureFocusOnMount={
						openedButton &&
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						openedButton.controls &&
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						openedButton.controls.captureFocusOnMount
					}
					showCloseButton={
						openedButton &&
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						openedButton.controls &&
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						openedButton.controls.showCloseButton
					}
					disableClickProxying={
						openedButton &&
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						openedButton.controls &&
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						openedButton.controls.disableClickProxying
					}
				>
					{({ pendingAttrs, onClose }) => (
						// @ts-expect-error ts-migrate(2604) FIXME: JSX element type 'ControlsComponent' does not have... Remove this comment to see the full error message
						<ControlsComponent
							editorChangeObject={editorChangeObject}
							pendingAttrs={pendingAttrs}
							onClose={onClose}
							isSmall={isSmall}
							citationStyle={citationStyle}
							pubData={pubData}
						/>
					)}
				</FormattingBarPopover>
			)}
		</div>
	);
};
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
