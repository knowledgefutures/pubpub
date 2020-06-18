import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';

import { FormattingBar, buttons } from 'components/FormattingBar';
import Editor from 'components/Editor';
import { fullDoc } from 'utils/storybook/data';

class EditorUnit extends Component {
	static propTypes = {
		showBlockTypes: PropTypes.bool.isRequired,
		isSmall: PropTypes.bool.isRequired,
		buttons: PropTypes.array.isRequired,
	};

	constructor(props) {
		super(props);
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
							popoverContainerRef={this.containerRef}
						/>
					)}
				</div>
				<div
					style={{ padding: '0.25em', height: '250px', overflow: 'scroll' }}
					ref={this.containerRef}
				>
					<Editor
						placeholder="hello"
						onChange={(changeObject) => {
							this.setState({ editorChangeObject: changeObject });
						}}
						initialContent={fullDoc}
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
	<div style={wrapperStyle}>
		<EditorUnit isSmall={false} buttons={buttons.fullButtonSet} />
		<EditorUnit isSmall={true} buttons={buttons.fullButtonSet} />
		<EditorUnit showBlockTypes={true} isSmall={true} buttons={buttons.minimalButtonSet} />
		<EditorUnit showBlockTypes={false} isSmall={true} buttons={buttons.minimalButtonSet} />
	</div>
));
