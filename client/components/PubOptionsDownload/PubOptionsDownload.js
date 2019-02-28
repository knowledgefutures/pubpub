import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Intent } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import FileUploadButton from 'components/FileUploadButton/FileUploadButton';
import { apiFetch } from 'utilities';
import { getCollabJSONs } from '@pubpub/editor';

require('./pubOptionsDownload.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	editorView: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
	// TODO: we should pass in content in the case that we are in the working draft
	// or maybe just a reference to the function to get draft content.
};

class PubOptionsDownload extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			type: { format: 'pdf', title: 'PDF' },
			taskId: undefined,
		};
		this.getDraftContent = this.getDraftContent.bind(this);
		this.handleExport = this.handleExport.bind(this);
		this.updateDownloads = this.updateDownloads.bind(this);
		this.checkTask = this.checkTask.bind(this);
		this.getExistingDownload = this.getExistingDownload.bind(this);
		this.getFormattedDownload = this.getFormattedDownload.bind(this);
	}

	getDraftContent() {
		if (!this.props.pubData.isDraft) {
			return new Promise((resolve) => {
				resolve(undefined);
			});
		}

		const sectionsData = this.props.pubData.sectionsData;
		const editorRefs = sectionsData.map((item) => {
			return `${this.props.pubData.editorKey}/${item.id}`;
		});

		return getCollabJSONs(this.props.editorView, editorRefs)
			.then((content) => {
				const newContent =
					content.length === 1
						? content[0]
						: content.map((item, index) => {
								return {
									title: sectionsData[index].title,
									id: sectionsData[index].id,
									content: item,
								};
						  });
				return newContent;
			})
			.catch((err) => {
				console.error('Error getting draft content', err);
			});
	}

	getFormattedDownload() {
		const downloads = this.props.pubData.downloads || [];
		const formattedDownload = downloads.reduce((prev, curr) => {
			const currIsNewer = !prev.createdAt || curr.createdAt > prev.createdAt;
			if (curr.type === 'formatted' && currIsNewer) {
				return curr;
			}
			return prev;
		}, {});
		return formattedDownload;
	}

	getExistingDownload() {
		const downloads = this.props.pubData.downloads || [];
		return downloads.reduce((prev, curr) => {
			const sameVersion = curr.versionId === this.props.pubData.activeVersion.id;
			const sameType = curr.type === this.state.type.format;
			if (sameType && sameVersion) {
				return curr.url;
			}
			return prev;
		}, undefined);
	}

	handleExport() {
		const existingDownload = this.getExistingDownload();
		if (existingDownload) {
			return window.open(existingDownload);
		}
		// Check if that format is available for download, if not send off event.
		this.setState({ isLoading: true });
		return this.getDraftContent()
			.then((draftContent) => {
				return apiFetch('/api/export', {
					method: 'POST',
					body: JSON.stringify({
						pubId: this.props.pubData.id,
						versionId: this.props.pubData.isDraft
							? 'draft'
							: this.props.pubData.activeVersion.id,
						content: draftContent,
						format: this.state.type.format,
					}),
				});
			})
			.then((taskId) => {
				this.setState({ taskId: taskId });
				setTimeout(() => {
					this.checkTask();
				}, 1500);
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
	}

	updateDownloads(type, fileUrl) {
		if (type !== 'formatted' && !this.props.pubData.activeVersion.id) {
			return null;
		}
		const downloadItem = {
			type: type,
			url: fileUrl,
			versionId: type === 'formatted' ? undefined : this.props.pubData.activeVersion.id,
			createdAt: new Date(),
		};
		const prevDownloads = this.props.pubData.downloads || [];
		const newDownloads = [...prevDownloads, downloadItem];
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				downloads: newDownloads,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			}),
		})
			.then(() => {
				this.props.setPubData({
					...this.props.pubData,
					downloads: newDownloads,
				});
			})
			.catch((err) => {
				console.error('Error Saving Pub Downloads: ', err);
			});
	}

	checkTask() {
		return apiFetch(`/api/workerTasks?workerTaskId=${this.state.taskId}`)
			.then((taskData) => {
				if (taskData.isProcessing) {
					setTimeout(() => {
						this.checkTask();
					}, 1500);
				} else {
					this.setState({
						isLoading: false,
						taskId: undefined,
					});
					window.open(taskData.output.url);
					this.updateDownloads(this.state.type.format, taskData.output.url);
				}
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
	}

	render() {
		const formattedDownload = this.getFormattedDownload();
		const formattedDownloadUrl = formattedDownload.url || '';
		const formattedDownloadExtenstion = formattedDownloadUrl
			.split('.')
			.pop()
			.toLowerCase();
		const formattedDownloadDate = formattedDownload.date;
		const types = [
			{ format: 'pdf', title: 'PDF' },
			{ format: 'docx', title: 'Word' },
			{ format: 'markdown', title: 'Markdown' },
			{ format: 'epub', title: 'EPUB' },
			{ format: 'html', title: 'HTML' },
			{ format: 'odt', title: 'OpenDocument' },
			{ format: 'plain', title: 'Plain Text' },
			{ format: 'jats', title: 'JATS XML' },
			{ format: 'tex', title: 'LaTeX' },
		];
		return (
			<div className="pub-options-download-component">
				<h1>Download Pub</h1>

				{(this.props.pubData.isManager || !!formattedDownloadUrl) && (
					<div>
						<h2>Typeset Download</h2>
						<p>Editor specified download.</p>
						<div className="buttons-wrapper">
							{!!formattedDownloadUrl && (
								<div>
									<Button
										text="Download Typeset File"
										large={true}
										intent={Intent.PRIMARY}
										className="typset-button"
										onClick={() => {
											window.open(formattedDownloadUrl);
										}}
									/>
									<div className="subtext">
										.{formattedDownloadExtenstion} uploaded on{' '}
										{dateFormat(formattedDownloadDate, 'mmm dd, yyyy')}
									</div>
								</div>
							)}
							{this.props.pubData.isManager && (
								<FileUploadButton
									onUploadFinish={(fileUrl) => {
										this.updateDownloads('formatted', fileUrl);
									}}
									className="typset-button"
									text="Upload new typeset file"
								/>
							)}
						</div>
					</div>
				)}

				<h2>Generated Downloads</h2>
				<p>Auto-generated exports based on article content.</p>
				<div className="bp3-button-group">
					{types.map((type) => {
						return (
							<Button
								key={type.format}
								active={this.state.type.format === type.format}
								disabled={this.state.isLoading}
								onClick={() => {
									this.setState({ type: type });
								}}
								text={type.title}
							/>
						);
					})}
				</div>

				<div className="buttons-wrapper">
					<Button
						type="button"
						large={true}
						intent={Intent.PRIMARY}
						text={`Download ${this.state.type.title} File`}
						loading={this.state.isLoading}
						onClick={this.handleExport}
					/>
				</div>
			</div>
		);
	}
}

PubOptionsDownload.propTypes = propTypes;
export default PubOptionsDownload;
