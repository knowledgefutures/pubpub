import React, { Component } from 'react';
import { PubNoteContent, SimpleEditor } from 'components';

type Props = {
	attrs: any;
	updateAttrs: (...args: any[]) => any;
	isSmall: boolean;
	footnotes: any[];
};

type State = any;

class ControlsFootnote extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			structuredValue: props.attrs.structuredValue,
		};
	}

	render() {
		const hasRenderedContent = this.props.footnotes.length >= this.props.attrs.count;
		/* countToIndex: Footnote that renders as '1' is stored in 0th index of footnotes array */
		const countToIndex = this.props.attrs.count - 1;
		const renderContent = this.props.footnotes[countToIndex];
		return (
			<div
				className={`formatting-bar_controls-component ${this.props.isSmall ? 'small' : ''}`}
			>
				{/*  Content Adjustment */}
				<div className="block">
					<div className="label">Text</div>
					<div className="input wide">
						<div className="simple-editor-wrapper">
							<SimpleEditor
								initialHtmlString={this.props.attrs.value}
								onChange={(htmlString) => {
									this.props.updateAttrs({ value: htmlString });
								}}
							/>
						</div>
					</div>
				</div>

				{/*  Content Adjustment */}
				<div className="block">
					<div className="label">Structured Data</div>
					<div className="input wide">
						<textarea
							placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
							className="bp3-input bp3-fill"
							value={this.state.structuredValue}
							onChange={(evt) => {
								this.setState({ structuredValue: evt.target.value });
								this.props.updateAttrs({ structuredValue: evt.target.value });
							}}
						/>
					</div>
				</div>

				{/*  Output */}
				<div className="block">
					<div className="label">Structured Data Output</div>
					<div className="input wide">
						{hasRenderedContent && (
							<PubNoteContent
								// @ts-expect-error ts-migrate(2322) FIXME: Property 'structured' does not exist on type 'Intr... Remove this comment to see the full error message
								structured={renderContent.html}
								unstructured={renderContent.unstructuredValue}
							/>
						)}
					</div>
				</div>
			</div>
		);
	}
}
export default ControlsFootnote;
