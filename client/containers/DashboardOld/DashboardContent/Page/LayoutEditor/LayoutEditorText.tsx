import React, { Component } from 'react';
import { Button } from '@blueprintjs/core';

import { GridWrapper } from 'components';
import Editor, { getJSON } from 'components/Editor';
import InputField from 'components/InputField/InputField';
import FormattingBarLegacy from 'components/FormattingBarLegacy/FormattingBar';
import { getResizedUrl } from 'utils/images';

type Props = {
	onChange: (...args: any[]) => any;
	layoutIndex: number;
	content: any;
};

type State = any;

class LayoutEditorText extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			key: `text-block-${props.layoutIndex}`,
			initialContent: this.props.content.text || undefined,
			editorChangeObject: {},
		};
		this.setAlignLeft = this.setAlignLeft.bind(this);
		this.setAlignCenter = this.setAlignCenter.bind(this);
		this.setText = this.setText.bind(this);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'textChangesMade' does not exist on type ... Remove this comment to see the full error message
		this.textChangesMade = false;
	}

	setAlignLeft() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			align: 'left',
		});
	}

	setAlignCenter() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			align: 'center',
		});
	}

	setText(textJSON) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			text: textJSON,
		});
	}

	render() {
		const wrapperStyle = {
			textAlign: this.props.content.align || 'left',
		};
		return (
			<div className="layout-editor-text-component">
				<div className="block-header">
					<InputField label="Text Align">
						<div className="bp3-button-group">
							<Button
								className={`${
									this.props.content.align === 'left' ? 'bp3-active' : ''
								}`}
								onClick={this.setAlignLeft}
								text="Left"
							/>
							<Button
								className={`${
									this.props.content.align === 'center' ? 'bp3-active' : ''
								}`}
								onClick={this.setAlignCenter}
								text="Center"
							/>
						</div>
					</InputField>
					<div className="formatting-wrapper">
						<FormattingBarLegacy editorChangeObject={this.state.editorChangeObject} />
					</div>
				</div>

				<div className="block-content">
					<GridWrapper>
						<div style={wrapperStyle} id={String(this.state.key)}>
							<Editor
								nodeOptions={{
									image: {
										onResizeUrl: (url) => {
											return getResizedUrl(url, 'fit-in', '1200x0');
										},
										linkToSrc: false,
									},
								}}
								placeholder="Enter text..."
								initialContent={this.state.initialContent}
								onChange={(editorChangeObject) => {
									// @ts-expect-error
									if (editorChangeObject.view.state.history$.prevTime) {
										/* history$.prevTime will be 0 if the transaction */
										/* does not generate an undo item in the history */
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'textChangesMade' does not exist on type ... Remove this comment to see the full error message
										this.textChangesMade = true;
									}
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'textChangesMade' does not exist on type ... Remove this comment to see the full error message
									if (this.textChangesMade) {
										this.setText(getJSON(editorChangeObject.view));
									}
									this.setState({
										editorChangeObject: editorChangeObject,
									});
								}}
							/>
						</div>
					</GridWrapper>
				</div>
			</div>
		);
	}
}
export default LayoutEditorText;
