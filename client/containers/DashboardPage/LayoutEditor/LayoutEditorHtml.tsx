import React, { Component } from 'react';

import { GridWrapper } from 'components';

type Props = {
	onChange: (...args: any[]) => any;
	layoutIndex: number;
	content: any;
};

class LayoutEditorHtml extends Component<Props> {
	constructor(props: Props) {
		super(props);
		this.setText = this.setText.bind(this);
	}

	setText(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			html: evt.target.value,
		});
	}

	render() {
		return (
			<div className="layout-editor-html-component">
				<div className="block-header" />

				<div className="block-content">
					<GridWrapper>
						<textarea
							value={this.props.content.html}
							onChange={this.setText}
							placeholder="Type HTML here..."
						/>
					</GridWrapper>
				</div>
			</div>
		);
	}
}
export default LayoutEditorHtml;
