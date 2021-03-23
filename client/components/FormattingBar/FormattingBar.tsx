import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';

import { usePageContext } from 'utils/hooks';
import { useRefMap } from 'client/utils/useRefMap';
import { EditorChangeObject } from 'client/components/Editor';

import BlockTypeSelector from './BlockTypeSelector';
import FormattingBarButton from './FormattingBarButton';
import FormattingBarPopover from './FormattingBarPopover';
import { FormattingBarButtonData } from './types';
import { getButtonPopoverComponent } from './utils';
import { usePendingAttrs } from './hooks/usePendingAttrs';
import { useControlsState, ButtonState } from './hooks/useControlsState';

require('./formattingBar.scss');

type Props = {
	containerRef?: React.RefObject<HTMLElement>;
	editorChangeObject: EditorChangeObject;
	buttons: FormattingBarButtonData[][];
	showBlockTypes?: boolean;
	isSmall?: boolean;
	isTranslucent?: boolean;
	isFullScreenWidth?: boolean;
	citationStyle?: string;
};

const FormattingBar = (props: Props) => {
	const {
		editorChangeObject,
		containerRef,
		showBlockTypes = true,
		isSmall = false,
		isTranslucent = false,
		isFullScreenWidth = false,
		citationStyle = 'apa',
	} = props;

	const { selectedNode, updateNode } = editorChangeObject;
	const { communityData } = usePageContext();
	const buttonElementRefs = useRefMap();
	const toolbar = useToolbarState({ loop: true });

	const pendingAttrs = usePendingAttrs({
		selectedNode,
		updateNode,
		editorView: editorChangeObject.view,
	});

	const {
		openedButton,
		setOpenedButton,
		controlsPosition,
		selectedNodeId,
		ControlsComponent,
		buttonStates,
	} = useControlsState(props);

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

	const renderButtonState = (buttonState: ButtonState) => {
		const { button, isOpen, isActive, isIndicated, isDisabled, onClick } = buttonState;
		const maybeEditorView = button.key === 'media' && { view: editorChangeObject.view };
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
				onClick={onClick}
				{...maybeEditorView}
			/>
		);
	};

	const renderButtonGroup = (buttons: ButtonState[], index: number) => {
		return (
			<React.Fragment key={index}>
				{index > 0 && <div className="separator" />}
				{buttons.map(renderButtonState)}
			</React.Fragment>
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
				{buttonStates.map(renderButtonGroup)}
			</Toolbar>
			{ControlsComponent && openedButton && (
				<FormattingBarPopover
					editorChangeObject={editorChangeObject}
					accentColor={communityData.accentColorDark}
					title={openedButton.ariaTitle || openedButton.title}
					isFullScreenWidth={isFullScreenWidth}
					containerRef={containerRef}
					floatingPosition={controlsPosition}
					captureFocusOnMount={openedButton.controls?.captureFocusOnMount}
					showCloseButton={openedButton.controls?.showCloseButton}
					onClose={() => setOpenedButton(null)}
				>
					<ControlsComponent
						key={selectedNodeId}
						editorChangeObject={editorChangeObject}
						isSmall={isSmall}
						citationStyle={citationStyle}
						pendingAttrs={pendingAttrs}
						onClose={() => setOpenedButton(null)}
					/>
				</FormattingBarPopover>
			)}
		</div>
	);
};

export default FormattingBar;
