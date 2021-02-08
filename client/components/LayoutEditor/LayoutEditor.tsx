import React, { Component } from 'react';
import { Button, Tooltip } from '@blueprintjs/core';
import stickybits from 'stickybits';

import { generateHash } from 'utils/hashes';
import { getPubsByBlockIndex } from 'utils/layout';
import { LayoutBlock } from 'utils/layout/types';
import { Pub, Community, Collection } from 'utils/types';

import LayoutEditorInsert from './LayoutEditorInsert';
import LayoutEditorPubs from './LayoutEditorPubs';
import LayoutEditorPagesCollections from './LayoutEditorPagesCollections';
import LayoutEditorText from './LayoutEditorText';
import LayoutEditorHtml from './LayoutEditorHtml';
import LayoutEditorBanner from './LayoutEditorBanner';
import LayoutEditorCollectionHeader from './LayoutEditorCollectionHeader';

require('./layoutEditor.scss');

type Props = {
	onChange: (layout: LayoutBlock[]) => unknown;
	initialLayout: LayoutBlock[];
	collection?: Collection;
	pubs: Pub[];
	communityData: Community & {
		pages: NonNullable<Community['pages']>;
		collections: NonNullable<Community['collections']>;
	};
};

type State = {
	layout: LayoutBlock[];
	pubRenderLists: Pub[][];
};

type LayoutUpdateFn = (newLayout: LayoutBlock[]) => LayoutBlock[];

const validBlockTypes = [
	'pubs',
	'text',
	'html',
	'banner',
	'collections-pages',
	'collection-header',
];

const getTitleKindForBlock = (blockType: string) => {
	if (blockType === 'collection-header') {
		return 'Collection Header';
	}
	if (blockType === 'collections-pages') {
		return 'Collections & Pages';
	}
	if (blockType === 'html') {
		return 'HTML';
	}
	return blockType;
};

class LayoutEditor extends Component<Props, State> {
	stickyInstance: null | ReturnType<typeof stickybits> = null;

	constructor(props: Props) {
		super(props);
		this.state = {
			layout: props.initialLayout,
			pubRenderLists: getPubsByBlockIndex(props.initialLayout, props.pubs, {
				collectionId: props.collection && props.collection.id,
			}),
		};
		this.updateLayout = this.updateLayout.bind(this);
		this.handleInsert = this.handleInsert.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleChangePartial = this.handleChangePartial.bind(this);
		this.handleRemove = this.handleRemove.bind(this);
		this.handleMoveUp = this.handleMoveUp.bind(this);
		this.handleMoveDown = this.handleMoveDown.bind(this);
	}

	componentDidMount() {
		this.stickyInstance = stickybits('.block-header', {
			// TODO(ian): this is a magic number to make this work "for now" --
			// it's the combined height of the global header and dashboard breadcrumbs
			stickyBitStickyOffset: 73 + 56,
		});
	}

	componentWillUnmount() {
		if (this.stickyInstance && this.stickyInstance.cleanup) {
			this.stickyInstance.cleanup();
		}
	}

	updateLayout(fn: LayoutUpdateFn) {
		this.setState((prevState) => {
			const { pubs, collection, onChange } = this.props;
			const newLayout = [...prevState.layout];
			const nextLayout = fn(newLayout);
			onChange(nextLayout);
			return {
				layout: nextLayout,
				pubRenderLists: getPubsByBlockIndex(nextLayout, pubs, {
					collectionId: collection && collection.id,
				}),
			};
		});
	}

	handleInsert(index: number, type: LayoutBlock['type'], newContent: LayoutBlock['content']) {
		this.updateLayout((newLayout) => {
			newLayout.splice(index, 0, {
				id: generateHash(8),
				type,
				content: newContent,
			} as LayoutBlock);
			return newLayout;
		});
	}

	handleChange(index: number, newContent: LayoutBlock['content']) {
		this.updateLayout((newLayout) => {
			newLayout[index].content = newContent;
			return newLayout;
		});
	}

	handleChangePartial(index: number, update: Partial<LayoutBlock['content']>) {
		this.updateLayout((layout) => {
			const block = layout[index];
			const nextBlock = { ...block, content: { ...block.content, ...update } };
			return [
				...layout.slice(0, index),
				nextBlock,
				...layout.slice(index + 1),
			] as LayoutBlock[];
		});
	}

	handleRemove(index: number) {
		this.updateLayout((newLayout) => {
			newLayout.splice(index, 1);
			return newLayout;
		});
	}

	handleMoveUp(index: number) {
		this.updateLayout((newLayout) => {
			const swap = newLayout[index - 1];
			newLayout[index - 1] = newLayout[index];
			newLayout[index] = swap;
			return newLayout;
		});
	}

	handleMoveDown(index: number) {
		this.updateLayout((newLayout) => {
			const swap = newLayout[index + 1];
			newLayout[index + 1] = newLayout[index];
			newLayout[index] = swap;
			return newLayout;
		});
	}

	render() {
		const { collection } = this.props;
		const cannotRemoveLonePubsBlock =
			!!this.props.collection &&
			this.state.layout.filter((block) => block.type === 'pubs').length === 1;
		return (
			<div className="layout-editor-component">
				<LayoutEditorInsert
					insertIndex={0}
					onInsert={this.handleInsert}
					communityData={this.props.communityData}
					showCollectionHeaderBlock={!!collection}
					pubSort={collection ? 'collection-rank' : 'creation-date'}
				/>
				{this.state.layout.map((item, index) => {
					const validType = validBlockTypes.indexOf(item.type) > -1;
					const cannotRemove = cannotRemoveLonePubsBlock && item.type === 'pubs';
					if (!validType) {
						return null;
					}
					return (
						<div key={item.id}>
							<div className="block-title">
								<div className="text">{getTitleKindForBlock(item.type)} Block</div>

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
									{!cannotRemove && (
										<Button
											text="Remove"
											onClick={() => this.handleRemove(index)}
										/>
									)}
									{cannotRemove && (
										<Tooltip content="This layout requires at least one Pubs block.">
											<Button text="Remove" disabled />
										</Tooltip>
									)}
								</div>
							</div>
							<div key={`block-${item.id}`} className="component-wrapper">
								{item.type === 'pubs' && (
									<LayoutEditorPubs
										key={`item-${item.id}`}
										onChange={this.handleChangePartial}
										layoutIndex={index}
										block={item}
										pubsInBlock={this.state.pubRenderLists[index] || []}
										allPubs={this.props.pubs}
										communityData={this.props.communityData}
										hideOrderControl={!collection}
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
								{item.type === 'collections-pages' && (
									<LayoutEditorPagesCollections
										key={`item-${item.id}`}
										onChange={this.handleChange}
										layoutIndex={index}
										content={item.content}
										pages={this.props.communityData.pages}
										collections={this.props.communityData.collections}
									/>
								)}
								{!!collection && item.type === 'collection-header' && (
									<LayoutEditorCollectionHeader
										key={`item-${item.id}`}
										layoutIndex={index}
										onChange={this.handleChangePartial}
										collection={collection}
										block={item}
									/>
								)}
							</div>
							<LayoutEditorInsert
								key={`insert-${item.id}`}
								insertIndex={index + 1}
								onInsert={this.handleInsert}
								communityData={this.props.communityData}
								showCollectionHeaderBlock={!!collection}
								pubSort={collection ? 'collection-rank' : 'creation-date'}
							/>
						</div>
					);
				})}
			</div>
		);
	}
}
export default LayoutEditor;
