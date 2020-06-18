import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import stickybits from 'stickybits';

import { generateHash } from 'utils/hashes';
import { generateRenderLists } from 'utils/pages';

import LayoutEditorInsert from './LayoutEditorInsert';
import LayoutEditorPubs from './LayoutEditorPubs';
import LayoutEditorPages from './LayoutEditorPages';
import LayoutEditorText from './LayoutEditorText';
import LayoutEditorHtml from './LayoutEditorHtml';
import LayoutEditorBanner from './LayoutEditorBanner';

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
		this.stickyInstance = undefined;
	}

	componentDidMount() {
		this.stickyInstance = stickybits('.block-header', {
			// TODO(ian): this is a magic number to make this work "for now" --
			// it's the combined height of the global header and dashboard breadcrumbs
			stickyBitStickyOffset: 73 + 56,
		});
	}

	componentWillUnmount() {
		if (this.stickyInstance && this.stickyInstance.cleanUp) {
			this.stickyInstance.cleanUp();
		}
	}

	handleInsert(index, type, newContent) {
		this.setState((prevState) => {
			const newLayout = prevState.layout;
			newLayout.splice(index, 0, {
				id: generateHash(8),
				type: type,
				content: newContent,
			});
			const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
			this.props.onChange(newLayout);
			return {
				layout: newLayout,
				pubRenderLists: newPubRenderList,
			};
		});
	}

	handleChange(index, newContent) {
		this.setState((prevState) => {
			const newLayout = prevState.layout;
			newLayout[index].content = newContent;
			const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
			this.props.onChange(newLayout);
			return {
				layout: newLayout,
				pubRenderLists: newPubRenderList,
			};
		});
	}

	handleRemove(index) {
		this.setState((prevState) => {
			const newLayout = prevState.layout;
			newLayout.splice(index, 1);
			this.props.onChange(newLayout);
			return { layout: newLayout };
		});
	}

	handleMoveUp(index) {
		this.setState((prevState) => {
			const newLayout = [...prevState.layout];
			newLayout[index - 1] = newLayout[index];
			newLayout[index] = prevState.layout[index - 1];

			const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
			this.props.onChange(newLayout);
			return {
				layout: newLayout,
				pubRenderLists: newPubRenderList,
			};
		});
	}

	handleMoveDown(index) {
		this.setState((prevState) => {
			const newLayout = [...prevState.layout];
			newLayout[index + 1] = newLayout[index];
			newLayout[index] = prevState.layout[index + 1];

			const newPubRenderList = generateRenderLists(newLayout, this.props.pubs);
			this.props.onChange(newLayout);
			return {
				layout: newLayout,
				pubRenderLists: newPubRenderList,
			};
		});
	}

	render() {
		return (
			<div className="layout-editor-component">
				<LayoutEditorInsert
					insertIndex={0}
					onInsert={this.handleInsert}
					communityData={this.props.communityData}
				/>
				{this.state.layout.map((item, index) => {
					const validType =
						['pubs', 'text', 'html', 'banner', 'pages'].indexOf(item.type) > -1;
					if (!validType) {
						return null;
					}
					return (
						<div key={item.id}>
							<div className="block-title">
								<div className="text">
									{item.type === 'html' ? 'HTML' : item.type} Block
								</div>

								<div className="bp3-button-group bp3-minimal bp3-small">
									<Button
										text="Move Up"
										icon="caret-up"
										disabled={index === 0}
										onClick={() => {
											this.handleMoveUp(index);
										}}
									/>
									<Button
										text="Move Down"
										icon="caret-down"
										disabled={index === this.state.layout.length - 1}
										onClick={() => {
											this.handleMoveDown(index);
										}}
									/>
									<Button
										text="Remove"
										onClick={() => {
											this.handleRemove(index);
										}}
									/>
								</div>
							</div>
							<div key={`block-${item.id}`} className="component-wrapper">
								{item.type === 'pubs' && (
									<LayoutEditorPubs
										key={`item-${item.id}`}
										onChange={this.handleChange}
										layoutIndex={index}
										content={item.content}
										pubRenderList={this.state.pubRenderLists[index] || []}
										pubs={this.props.pubs}
										communityData={this.props.communityData}
									/>
								)}
								{item.type === 'text' && (
									<LayoutEditorText
										key={`item-${item.id}`}
										onChange={this.handleChange}
										layoutIndex={index}
										content={item.content}
									/>
								)}
								{item.type === 'html' && (
									<LayoutEditorHtml
										key={`item-${item.id}`}
										onChange={this.handleChange}
										layoutIndex={index}
										content={item.content}
									/>
								)}
								{item.type === 'banner' && (
									<LayoutEditorBanner
										key={`item-${item.id}`}
										onChange={this.handleChange}
										layoutIndex={index}
										content={item.content}
										communityData={this.props.communityData}
									/>
								)}
								{item.type === 'pages' && (
									<LayoutEditorPages
										key={`item-${item.id}`}
										onChange={this.handleChange}
										layoutIndex={index}
										content={item.content}
										pages={this.props.communityData.pages}
									/>
								)}
							</div>
							<LayoutEditorInsert
								key={`insert-${item.id}`}
								insertIndex={index + 1}
								onInsert={this.handleInsert}
								communityData={this.props.communityData}
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
