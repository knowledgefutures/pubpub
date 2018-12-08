import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';
import { apiFetch, s3Upload } from 'utilities';
import { importHtml } from '@pubpub/editor';

require('./pubInlineImport.scss');

const propTypes = {
	editorView: PropTypes.object.isRequired,
};

class PubInlineImport extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			taskId: undefined,
		};
		this.handleFileSelect = this.handleFileSelect.bind(this);
		this.handleUploadFinish = this.handleUploadFinish.bind(this);
		this.checkTask = this.checkTask.bind(this);
	}

	handleFileSelect(evt) {
		s3Upload(evt.target.files[0], ()=>{}, this.handleUploadFinish, 0);
		this.setState({
			isLoading: true,
		});
	}

	handleUploadFinish(evt, index, type, filename) {
		const sourceUrl = `https://assets.pubpub.org/${filename}`;
		// Check if that format is available for download, if not send off event.
		// this.setState({ isLoading: true });
		return apiFetch('/api/import', {
			method: 'POST',
			body: JSON.stringify({
				sourceUrl: sourceUrl
				// sourceUrl: 'https://assets.pubpub.org/juflxg08/427a3c55-993a-4083-918c-85c682bedccf.docx',
				// sourceUrl: 'https://assets.pubpub.org/_testing/01532122050220.docx',
			})
		})
		.then((taskId)=> {
			this.setState({ taskId: taskId });
			setTimeout(()=> {
				this.checkTask();
			}, 1500);
		})
		.catch(()=> {
			this.setState({ isLoading: false });
		});
	}

	checkTask() {
		return apiFetch(`/api/workerTasks?workerTaskId=${this.state.taskId}`)
		.then((taskData)=> {
			if (taskData.isProcessing) {
				setTimeout(()=> {
					this.checkTask();
				}, 1500);
			} else {
				importHtml(this.props.editorView, taskData.output.html);
			}
		})
		.catch(()=> {
			this.setState({ isLoading: false });
		});
	}

	render() {
		return (
			<div className="pub-inline-import-component">
				<label htmlFor="import-select-file">
					<AnchorButton
						type="button"
						className="bp3-intent-primary bp3-large"
						text={
							<div>
								<div>Import File</div>
								<div>.docx, .epub, .html, .md, .odt, .txt, .xml, or .tex</div>
							</div>
						}
						loading={this.state.isLoading}
					/>
					<input
						id="import-select-file"
						name="logo"
						type="file"
						accept=".docx, .epub, .html, .md, .odt, .txt, .xml, .tex"
						onChange={this.handleFileSelect}
					/>
				</label>

			</div>
		);
	}
}

PubInlineImport.propTypes = propTypes;
export default PubInlineImport;
