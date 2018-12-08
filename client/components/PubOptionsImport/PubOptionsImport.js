import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';
import { apiFetch, s3Upload } from 'utilities';
import { importHtml } from '@pubpub/editor';

require('./pubOptionsImport.scss');

const propTypes = {
	// communityData: PropTypes.object.isRequired,
	// pubData: PropTypes.object.isRequired,
	editorView: PropTypes.object.isRequired,
	setOptionsMode: PropTypes.func.isRequired,
	// loginData: PropTypes.object.isRequired,
	// setPubData: PropTypes.func.isRequired,
	// TODO: we should pass in content in the case that we are in the working draft
	// or maybe just a reference to the function to get draft content.
};

class PubOptionsImport extends Component {
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
				this.props.setOptionsMode(undefined);
			}
		})
		.catch(()=> {
			this.setState({ isLoading: false });
		});
	}

	render() {
		return (
			<div className="pub-options-import-component">
				<h1>Import to Pub</h1>
				<p>You can import .docx, .epub, .html, .md, .odt, .txt, .xml, .tex</p>
				<label htmlFor="import-select-file">
					<AnchorButton
						type="button"
						className="bp3-intent-primary bp3-large"
						text="Import File"
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

PubOptionsImport.propTypes = propTypes;
export default PubOptionsImport;
