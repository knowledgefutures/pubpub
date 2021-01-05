import React, { Component } from 'react';
import { storiesOf } from '@storybook/react';

import { FormattingBar, buttons } from 'components/FormattingBar';
import Editor from 'components/Editor';
import { fullDoc } from 'utils/storybook/data';

type Props = {
	showBlockTypes: boolean;
	isSmall: boolean;
	buttons: any[];
};

type State = any;

class EditorUnit extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'containerRef' does not exist on type 'Ed... Remove this comment to see the full error message
		this.containerRef = React.createRef();
		this.state = {
			editorChangeObject: null,
		};
	}

	render() {
		const editorStyle = {
			width: this.props.isSmall ? 'calc(100% / 3 - 1em)' : 'calc(100%)',
			marginBottom: '1em',
			border: '1px solid #CCC',
			borderRadius: '2px',
		};

		return (
			<div style={editorStyle}>
				<div style={{ background: '#F0F0F0', marginBottom: '0.5em' }}>
					{this.state.editorChangeObject && (
						<FormattingBar
							editorChangeObject={this.state.editorChangeObject}
							showBlockTypes={this.props.showBlockTypes}
							isSmall={this.props.isSmall}
							buttons={this.props.buttons}
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'containerRef' does not exist on type 'Ed... Remove this comment to see the full error message
							popoverContainerRef={this.containerRef}
						/>
					)}
				</div>
				<div
					style={{ padding: '0.25em', height: '250px', overflow: 'scroll' }}
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'containerRef' does not exist on type 'Ed... Remove this comment to see the full error message
					ref={this.containerRef}
				>
					<Editor
						placeholder="hello"
						onChange={(changeObject) => {
							this.setState({ editorChangeObject: changeObject });
						}}
						initialContent={fullDoc as any}
					/>
				</div>
			</div>
		);
	}
}

const wrapperStyle = {
	padding: '1em 1em',
	display: 'flex',
	justifyContent: 'space-between',
	flexWrap: 'wrap',
};

storiesOf('components/FormattingBar', module).add('default', () => (
	// @ts-expect-error ts-migrate(2322) FIXME: Type '{ padding: string; display: string; justifyC... Remove this comment to see the full error message
	<div style={wrapperStyle}>
		{/* @ts-expect-error ts-migrate(2741) FIXME: Property 'showBlockTypes' is missing in type '{ is... Remove this comment to see the full error message */}
		<EditorUnit isSmall={false} buttons={buttons.fullButtonSet} />
		{/* @ts-expect-error ts-migrate(2741) FIXME: Property 'showBlockTypes' is missing in type '{ is... Remove this comment to see the full error message */}
		<EditorUnit isSmall={true} buttons={buttons.fullButtonSet} />
		<EditorUnit showBlockTypes={true} isSmall={true} buttons={buttons.minimalButtonSet} />
		<EditorUnit showBlockTypes={false} isSmall={true} buttons={buttons.minimalButtonSet} />
	</div>
));
