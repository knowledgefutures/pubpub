import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import { FormattingBar, buttons } from 'components/FormattingBarNew';

import Editor from '@pubpub/editor';
import { plainDoc, fullDoc } from 'data';

class EditorUnit extends Component {
	static propTypes = {
		showMedia: PropTypes.bool.isRequired,
		showBlockTypes: PropTypes.bool.isRequired,
		isSmall: PropTypes.bool.isRequired,
		buttons: PropTypes.array.isRequired,
	};

	constructor(props) {
		super(props);
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
							showMedia={this.props.showMedia}
							showBlockTypes={this.props.showBlockTypes}
							isSmall={this.props.isSmall}
							buttons={this.props.buttons}
						/>
					)}
				</div>
				<div style={{ padding: '0.25em', height: '250px', overflow: 'scroll' }}>
					<Editor
						placeholder="hello"
						onChange={(changeObject) => {
							this.setState({ editorChangeObject: changeObject });
						}}
						initialContent={this.props.showMedia ? plainDoc : fullDoc}
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
		<EditorUnit
			showMedia={false}
			showBlockTypes={true}
			isSmall={true}
			buttons={buttons.minimalButtonSet}
		/>
		<EditorUnit
			showMedia={false}
			showBlockTypes={false}
			isSmall={true}
			buttons={buttons.minimalButtonSet}
		/>
	</div>
));
