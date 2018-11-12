import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LayoutEditorInsert from 'components/LayoutEditorInsert/LayoutEditorInsert';
import LayoutEditorPubs from 'components/LayoutEditorPubs/LayoutEditorPubs';
import LayoutEditorText from 'components/LayoutEditorText/LayoutEditorText';
import LayoutEditorHtml from 'components/LayoutEditorHtml/LayoutEditorHtml';
import LayoutEditorBanner from 'components/LayoutEditorBanner/LayoutEditorBanner';
// import LayoutEditorCreatePub from 'components/LayoutEditorCreatePub/LayoutEditorCreatePub';
// import LayoutEditorDrafts from 'components/LayoutEditorDrafts/LayoutEditorDrafts';
import { Button } from '@blueprintjs/core';
import { generateHash, generateRenderLists } from 'utilities';

require('./layoutEditor.scss');

const propTypes = {
	onChange: PropTypes.func.isRequired,
	initialLayout: PropTypes.array.isRequired,
	pubs: PropTypes.array.isRequired,
	communityData: PropTypes.object.isRequired,
};

class LayoutEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {
			layout: props.initialLayout,
			pubRenderLists: generateRenderLists(props.initialLayout, props.pubs),
		};
		this.handleInsert = this.handleInsert.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleRemove = this.handleRemove.bind(this);
		this.handleMoveUp = this.handleMoveUp.bind(this);
		this.handleMoveDown = this.handleMoveDown.bind(this);
	}

	handleInsert(index, type) {
		const newLayout = this.state.layout;
		const defaultContents = {
			pubs: {
				title: '',
				pubPreviewType: 'medium',
				limit: 0,
				pubIds: [],
				tagIds: [],
			},
			text: {
				title: '',
				align: 'left',
				width: 'wide',
				text: undefined,
			},
			html: {
				title: '',
				html: '',
			},
			banner: {
				text: '',
				align: 'left',
				backgroundColor: '',
				backgroundImage: '',
				backgroundSize: 'full',
				showButton: false,
				buttonText: '',
				defaultTagIds: [],
			},
			// createPub: {
			// 	text: '',
			// 	align: 'left',
			// 	size: 'standard',
			// 	defaultTags: [],
			// },
			// drafts: {
			// 	title: 'Open Drafts'
			// },
		};
		newLayout.splice(index, 0, {
			id: generateHash(8),
			type: type,
			content: defaultContents[type],
		});
		const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
		this.setState({
			layout: newLayout,
			pubRenderLists: newPubRenderList,
		});
		this.props.onChange(newLayout);
	}

	handleChange(index, newContent) {
		const newLayout = this.state.layout;
		newLayout[index].content = newContent;
		const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
		this.setState({
			layout: newLayout,
			pubRenderLists: newPubRenderList,
		});
		this.props.onChange(newLayout);
	}

	handleRemove(index) {
		const newLayout = this.state.layout;
		newLayout.splice(index, 1);
		this.setState({ layout: newLayout });
		this.props.onChange(newLayout);
	}

	handleMoveUp(index) {
		const newLayout = [...this.state.layout];
		newLayout[index - 1] = newLayout[index];
		newLayout[index] = this.state.layout[index - 1];

		const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
		this.setState({
			layout: newLayout,
			pubRenderLists: newPubRenderList,
		});
		this.props.onChange(newLayout);
	}

	handleMoveDown(index) {
		const newLayout = [...this.state.layout];
		newLayout[index + 1] = newLayout[index];
		newLayout[index] = this.state.layout[index + 1];

		const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
		this.setState({
			layout: newLayout,
			pubRenderLists: newPubRenderList,
		});
		this.props.onChange(newLayout);
	}

	render() {
		return (
			<div className="layout-editor-component">
				<LayoutEditorInsert
					insertIndex={0}
					onInsert={this.handleInsert}
				/>
				{this.state.layout.map((item, index)=> {
					const validType = ['pubs', 'text', 'html', 'banner'].indexOf(item.type) > -1;
					if (!validType) { return null; }
					return (
						<div key={item.id}>
							<div className="block-actions pt-button-group pt-minimal pt-small">
								<Button
									text="Move up"
									icon="caret-up"
									disabled={index === 0}
									onClick={()=> {
										this.handleMoveUp(index);
									}}
								/>
								<Button
									text="Move down"
									icon="caret-down"
									disabled={index === this.state.layout.length - 1}
									onClick={()=> {
										this.handleMoveDown(index);
									}}
								/>
								<Button
									text="Remove"
									onClick={()=> {
										this.handleRemove(index);
									}}
								/>
							</div>
							<div key={`block-${item.id}`} className="component-wrapper">
								{item.type === 'pubs' &&
									<LayoutEditorPubs
										key={`item-${item.id}`}
										onChange={this.handleChange}
										onRemove={this.handleRemove}
										layoutIndex={index}
										content={item.content}
										pubRenderList={this.state.pubRenderLists[index] || []}
										pubs={this.props.pubs}
										communityData={this.props.communityData}
									/>
								}
								{item.type === 'text' &&
									<LayoutEditorText
										key={`item-${item.id}`}
										onChange={this.handleChange}
										onRemove={this.handleRemove}
										layoutIndex={index}
										content={item.content}
									/>
								}
								{item.type === 'html' &&
									<LayoutEditorHtml
										key={`item-${item.id}`}
										onChange={this.handleChange}
										onRemove={this.handleRemove}
										layoutIndex={index}
										content={item.content}
									/>
								}
								{item.type === 'banner' &&
									<LayoutEditorBanner
										key={`item-${item.id}`}
										onChange={this.handleChange}
										onRemove={this.handleRemove}
										layoutIndex={index}
										content={item.content}
										communityData={this.props.communityData}
									/>
								}
								{/* item.type === 'createPub' &&
									<LayoutEditorCreatePub
										key={`item-${item.id}`}
										onChange={this.handleChange}
										onRemove={this.handleRemove}
										layoutIndex={index}
										content={item.content}
									/>
								*/}
							</div>
							<LayoutEditorInsert
								key={`insert-${item.id}`}
								insertIndex={index + 1}
								onInsert={this.handleInsert}
							/>
						</div>
					);
				})}
			</div>
		);
	}
}

LayoutEditor.propTypes = propTypes;
export default LayoutEditor;
