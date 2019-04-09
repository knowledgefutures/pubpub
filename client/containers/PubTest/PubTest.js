import React from 'react';
import PropTypes from 'prop-types';
import Editor from '@pubpub/editor';
import { Slider, ButtonGroup, Button, RangeSlider } from '@blueprintjs/core';
import { Node, DOMSerializer } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';
import { uncompressStateJSON, uncompressStepJSON } from 'prosemirror-compress-pubpub';
import { Plugin } from 'prosemirror-state';
import { DecorationSet, Decoration } from 'prosemirror-view';
import { ChangeSet, simplifyChanges } from 'prosemirror-changeset';
import { buildSchema } from '@pubpub/editor';
import discussionSchema from 'components/DiscussionAddon/discussionSchema';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper, getResizedUrl } from 'utilities';

require('./pubTest.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
};

class PubTest extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			mode: 'server-render',
			sliderLabelVal: this.props.pubData.changeArray.length - 1,
			sliderIndex: this.props.pubData.changeArray.length - 1,
			diffLabelVal: [0, this.props.pubData.changeArray.length - 1],
			diffRange: [0, this.props.pubData.changeArray.length - 1],
		};
	}

	generatePlugin(changes) {
		console.log(changes);
		if (this.state.mode !== 'diff') {
			return undefined;
		}
		const editorSchema = buildSchema({ ...discussionSchema }, {});
		return {
			changesPlugin: () => {
				return new Plugin({
					props: {
						decorations: (state) => {
							const doc = state.doc;
							const decorations = changes.map((change) => {
								const output = [];
								if (change.inserted.length) {
									output.push(
										Decoration.inline(change.fromB, change.toB, {
											class: 'addition',
										}),
									);
								}
								change.deleted.forEach((deletion) => {
									const elem = document.createElement('span');
									const serializer = DOMSerializer.fromSchema(editorSchema);
									/* I don't realllly get what's going on here */
									/* This helped me along: https://discuss.prosemirror.net/t/a-proposed-way-to-visualize-a-changeset/1628/6 */
									elem.appendChild(
										serializer.serializeFragment(deletion.data.slice.content),
									);
									elem.className = 'deletion';
									output.push(Decoration.widget(change.fromB, elem));
								});

								return output;
							});

							const flattenArray = [].concat(...decorations);
							return DecorationSet.create(doc, flattenArray);
						},
					},
				});
			},
		};
	}

	render() {
		let initialContent;
		let changes;
		if (this.state.mode === 'server-render') {
			initialContent = this.props.pubData.content;
		}
		if (this.state.mode === 'slider') {
			initialContent = this.props.pubData.changeArray[this.state.sliderIndex].doc;
		}
		if (this.state.mode === 'diff') {
			const startStepIndex = this.props.pubData.changeArray[this.state.diffRange[0]].index;
			const endStepIndex = this.props.pubData.changeArray[this.state.diffRange[1]].index + 1;
			const editorSchema = buildSchema({ ...discussionSchema }, {});
			const initJSON = { type: 'doc', attrs: { meta: {} }, content: [{ type: 'paragraph' }] };
			const initDoc = Node.fromJSON(editorSchema, initJSON);
			const steps = [];
			const { changesSnapshotVal } = this.props.pubData;

			Object.keys(changesSnapshotVal).forEach((key) => {
				if (!changesSnapshotVal[key]) {
					return null;
				}
				const compressedStepsJSON = changesSnapshotVal[key].s;
				const uncompressedSteps = compressedStepsJSON.map((compressedStepJSON) => {
					return Step.fromJSON(editorSchema, uncompressStepJSON(compressedStepJSON));
				});
				return steps.push(...uncompressedSteps);
			});

			const baseSteps = [...steps].slice(0, startStepIndex);
			// console.log('baseSteps', baseSteps);
			const baseDoc = baseSteps.reduce((prev, curr) => {
				const stepResult = curr.apply(prev);
				if (stepResult.failed) {
					console.error('Failed with ', stepResult.failed);
				}
				return stepResult.doc;
			}, initDoc);
			// console.log('baseDoc', baseDoc);
			const baseChangeSet = ChangeSet.create(baseDoc);
			const diffSteps = [...steps].slice(startStepIndex, endStepIndex);
			const diffStepMaps = diffSteps.map((step) => {
				return step.getMap();
			});
			const diffStepsInverted = [];
			// console.log('diffSteps', diffSteps);
			// console.log('diffStepMaps', diffStepMaps);
			const nextDoc = diffSteps.reduce((prev, curr) => {
				const stepResult = curr.apply(prev);
				diffStepsInverted.push(curr.invert(prev));
				if (stepResult.failed) {
					console.error('Failed with ', stepResult.failed);
				}
				return stepResult.doc;
			}, baseDoc);
			const diffedChangeSet = baseChangeSet.addSteps(
				nextDoc,
				diffStepMaps,
				diffStepsInverted,
			);
			// console.log(diffedChangeSet);
			initialContent = nextDoc.toJSON();
			changes = diffedChangeSet.changes;
			// console.log(simplifyChanges(changes, nextDoc));
		}

		let key = 'static';
		if (this.state.mode === 'slider') {
			key = this.state.sliderIndex;
		}
		if (this.state.mode === 'diff') {
			key = `${this.state.diffRange[0]}-${this.state.diffRange[1]}`;
		}
		return (
			<div id="pub-test-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
				>
					<ButtonGroup fill={true}>
						<Button
							text="Server Render"
							onClick={() => {
								this.setState({ mode: 'server-render' });
							}}
							active={this.state.mode === 'server-render'}
						/>
						<Button
							text="Slider"
							onClick={() => {
								this.setState({ mode: 'slider' });
							}}
							active={this.state.mode === 'slider'}
						/>
						<Button
							text="Diff"
							onClick={() => {
								this.setState({ mode: 'diff' });
							}}
							active={this.state.mode === 'diff'}
						/>
					</ButtonGroup>

					{this.state.mode === 'slider' && (
						<Slider
							value={this.state.sliderLabelVal}
							onChange={(val) => {
								this.setState({ sliderLabelVal: val });
							}}
							onRelease={(val) => {
								this.setState({ sliderIndex: val });
							}}
							max={this.props.pubData.changeArray.length - 1}
							labelStepSize={5}
							labelRenderer={(val) => {
								return <span>{this.props.pubData.changeArray[val].index}</span>;
							}}
						/>
					)}
					{this.state.mode === 'diff' && (
						<RangeSlider
							value={this.state.diffLabelVal}
							onChange={(val) => {
								this.setState({ diffLabelVal: val });
							}}
							onRelease={(val) => {
								this.setState({ diffRange: val });
							}}
							max={this.props.pubData.changeArray.length - 1}
							labelStepSize={5}
							labelRenderer={(val) => {
								return <span>{this.props.pubData.changeArray[val].index}</span>;
							}}
						/>
					)}

					<Editor
						key={key}
						customNodes={{
							...discussionSchema,
						}}
						nodeOptions={{
							image: {
								onResizeUrl: (url) => {
									return getResizedUrl(url, 'fit-in', '800x0');
								},
							},
						}}
						customPlugins={this.generatePlugin(changes)}
						placeholder="Begin Writing"
						initialContent={initialContent}
					/>
				</PageWrapper>
			</div>
		);
	}
}

PubTest.propTypes = propTypes;
export default PubTest;

hydrateWrapper(PubTest);
