import type { EditorView } from 'prosemirror-view';

import type { EditorChangeObject } from 'components/Editor';

import type { ControlsConfiguration, FormattingBarButtonData } from './types';

import React, { useEffect, useRef } from 'react';

import classNames from 'classnames';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';

import { useRefMap } from 'client/utils/useRefMap';
import { usePageContext } from 'utils/hooks';

import BlockTypeSelector from './BlockTypeSelector';
import FormattingBarButton from './FormattingBarButton';
import FormattingBarControlsContainer from './FormattingBarControlsContainer';
import { type ButtonState, useControlsState } from './hooks/useControlsState';
import { usePendingAttrs } from './hooks/usePendingAttrs';
import { getButtonPopoverComponent } from './utils';

import './formattingBar.scss';

type Props = {
	editorChangeObject: EditorChangeObject;
	buttons: FormattingBarButtonData[][];
	showBlockTypes?: boolean;
	isSmall?: boolean;
	isTranslucent?: boolean;
	citationStyle?: string;
	controlsConfiguration?: Partial<ControlsConfiguration>;
};

const shimEditorChangeObject = {
	view: {} as EditorView,
	selectedNode: null,
	updateNode: () => {},
} as unknown as EditorChangeObject;

const FormattingBar = (props: Props) => {
	const {
		editorChangeObject: propsEditorChangeObject,
		isSmall = false,
		showBlockTypes = !isSmall,
		controlsConfiguration = {},
		isTranslucent = false,
		citationStyle = 'apa-7',
	} = props;

	const editorChangeObject = propsEditorChangeObject || shimEditorChangeObject;
	const { communityData, featureFlags } = usePageContext();
	// Hide suggested edits buttons when feature flag is off
	const buttons = featureFlags.suggestedEdits
		? props.buttons
		: props.buttons.map((arr) => {
				return arr.filter((button) => !button.key.startsWith('suggested-edits'));
			});
	const buttonElementRefs = useRefMap();
	const wrapperRef = useRef<null | HTMLDivElement>(null);
	const toolbar = useToolbarState({ loop: true });
	const pendingAttrs = usePendingAttrs(editorChangeObject);
	const {
		openedButton,
		setOpenedButton,
		selectedNodeId,
		buttonStates,
		resolvedControlsConfiguration,
	} = useControlsState({
		buttons,
		editorChangeObject,
		controlsConfiguration: {
			kind: isSmall ? 'floating' : 'anchored',
			container: wrapperRef.current!,
			isAbsolutelyPositioned: false,
			isFullScreenWidth: false,
			...controlsConfiguration,
		},
	});

	useEffect(() => {
		if (openedButton) {
			const ref = buttonElementRefs.getRef(openedButton.key);
			if (ref && ref.current && typeof ref.current.scrollIntoView === 'function') {
				const buttonElement = ref.current;
				const paddingPx = 5;
				buttonElement.parentNode.scrollLeft = buttonElement.offsetLeft - paddingPx;
			}
		}
	}, [openedButton]);

	const renderButtonState = (buttonState: ButtonState) => {
		const { button, isOpen, isActive, isIndicated, isDisabled, isDetached, onClick } =
			buttonState;
		const maybeEditorView = button.key === 'media' && { view: editorChangeObject.view };
		const PopoverComponent = getButtonPopoverComponent(button, isDisabled);

		return (
			<ToolbarItem
				{...toolbar}
				outerRef={buttonElementRefs.getRef(button.key)}
				as={button.component || FormattingBarButton}
				key={button.key}
				label={button.label}
				formattingItem={button}
				disabled={isDisabled}
				isActive={isActive}
				isIndicated={isIndicated && !isOpen}
				isOpen={isOpen}
				isDetached={isDetached}
				isSmall={isSmall}
				popoverContent={PopoverComponent && <PopoverComponent />}
				accentColor={communityData.accentColorDark}
				onClick={onClick}
				{...maybeEditorView}
			/>
		);
	};

	const renderButtonGroup = (states: ButtonState[], index: number) => {
		return (
			<React.Fragment key={index}>
				{index > 0 && <div className="separator" />}
				{states.map(renderButtonState)}
			</React.Fragment>
		);
	};

	const renderControls = () => {
		if (resolvedControlsConfiguration) {
			const { component: ControlsComponent } = resolvedControlsConfiguration;
			return (
				<FormattingBarControlsContainer
					controlsConfiguration={resolvedControlsConfiguration}
					editorChangeObject={editorChangeObject}
					accentColor={communityData.accentColorDark}
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
				</FormattingBarControlsContainer>
			);
		}
		return null;
	};

	return (
		<div
			ref={wrapperRef}
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
			{renderControls()}
		</div>
	);
};

export default FormattingBar;
