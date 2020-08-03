import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { InputField } from 'components';
import {
	getDepositRecordContentVersion,
	setDepositRecordContentVersion,
	isPreprint,
} from 'utils/crossref/parseDeposit';
import { apiFetch } from 'client/utils/apiFetch';

import AssignDoiPreview from './AssignDoiPreview';

require('./assignDoi.scss');

const noop = () => {};

const propTypes = {
	communityData: PropTypes.object.isRequired,
	disabled: PropTypes.bool,
	onDeposit: PropTypes.func,
	onError: PropTypes.func,
	onPreview: PropTypes.func,
	pubData: PropTypes.object.isRequired,
	target: PropTypes.string.isRequired,
};

const defaultProps = {
	disabled: false,
	onDeposit: noop,
	onError: noop,
	onPreview: noop,
};

const AssignDoiStatus = {
	Initial: 'initial',
	Previewing: 'previewing',
	Previewed: 'previewed',
	Depositing: 'depositing',
	Deposited: 'deposited',
};

const AssignDoiActionType = {
	FetchPreview: 'fetch_preview',
	FetchPreviewSuccess: 'fetch_preview_success',
	UpdateContentVersion: 'update_content_version',
	FetchDeposit: 'fetch_deposit',
	FetchDepositSuccess: 'fetch_deposit_success',
	Error: 'error',
};

const buttonTextByStatus = {
	[AssignDoiStatus.Initial]: 'Preview Deposit',
	[AssignDoiStatus.Previewing]: 'Getting Preview',
	[AssignDoiStatus.Previewed]: 'Submit Deposit',
	[AssignDoiStatus.Depositing]: 'Depositing',
	[AssignDoiStatus.Deposited]: 'DOI Deposited',
};

const getButtonText = (status, deposit) => {
	if (status === AssignDoiStatus.Initial && deposit) {
		return 'Resubmit DOI deposit';
	}

	return buttonTextByStatus[status];
};

export function reducer(state, action) {
	switch (action.type) {
		case AssignDoiActionType.FetchPreview:
			if (
				!(
					state.status === AssignDoiStatus.Initial ||
					state.status === AssignDoiStatus.Error ||
					// re-fetch preview
					state.status === AssignDoiStatus.Previewed
				)
			) {
				return state;
			}

			return {
				status: AssignDoiStatus.Previewing,
				result: null,
				error: null,
			};
		case AssignDoiActionType.FetchPreviewSuccess:
			if (state.status !== AssignDoiStatus.Previewing) {
				return state;
			}

			return {
				status: AssignDoiStatus.Previewed,
				result: action.payload,
				error: null,
			};
		case AssignDoiActionType.UpdateContentVersion:
			if (state.status !== AssignDoiStatus.Previewed) {
				return state;
			}

			const result = { ...state.result };

			// Not totally necessary here to create a full deep copy of the
			// object since we're not using a change detection algorithm
			// like `react-redux`, but this is technically a "Bad Practice":
			setDepositRecordContentVersion(
				result,
				action.payload === 'none' ? null : action.payload,
			);

			return {
				...state,
				status: AssignDoiStatus.Previewed,
				result: result,
			};
		case AssignDoiActionType.FetchDeposit:
			if (state.status !== AssignDoiStatus.Previewed) {
				return state;
			}

			return {
				status: AssignDoiStatus.Depositing,
				error: null,
			};
		case AssignDoiActionType.FetchDepositSuccess:
			if (state.status !== AssignDoiStatus.Depositing) {
				return state;
			}

			return {
				status: AssignDoiStatus.Deposited,
				result: action.payload,
				error: null,
			};
		case AssignDoiActionType.Error:
			return {
				status: AssignDoiStatus.Initial,
				error: action.payload,
			};
		default:
			return state;
	}
}

const initialState = {
	status: AssignDoiStatus.Initial,
	preview: null,
	result: null,
	error: null,
};

const contentVersionItems = [
	{ title: '(None)', key: 'none' },
	{ title: 'Preprint', key: 'preprint' },
	{ title: 'Advance Manuscript', key: 'am' },
	{ title: 'Version of Record', key: 'vor' },
];

function AssignDoi(props) {
	const { communityData, disabled, pubData, onPreview, onDeposit, onError, target } = props;
	const [{ status, result, error }, dispatch] = useReducer(reducer, initialState);

	// Extract the content version from current result (i.e. preview).
	let contentVersion = getDepositRecordContentVersion(result);

	// Assume preprint if no content version is present and body consists of posted_content.
	if (!contentVersion && isPreprint(result || pubData.crossrefDepositRecord)) {
		contentVersion = 'preprint';
	}

	// Default to "(None)" if no content version can be inferred.
	const activeContentVersionKey = contentVersion || 'none';
	const activeContentVersionItem = contentVersionItems.find(
		(item) => item.key === activeContentVersionKey,
	);

	const fetchPreview = async (nextContentVersion = contentVersion) => {
		dispatch({ type: AssignDoiActionType.FetchPreview });

		try {
			const params = new URLSearchParams({
				target: target,
				pubId: pubData.id,
				communityId: communityData.id,
				// Ensure we don't send &contentVersion=null in the case of null or
				// undefined content version.
				...(nextContentVersion && { contentVersion: nextContentVersion }),
			});
			const preview = await apiFetch(`/api/doiPreview?${params.toString()}`);

			onPreview(preview);

			dispatch({
				type: AssignDoiActionType.FetchPreviewSuccess,
				payload: preview,
			});
		} catch (err) {
			dispatch({ type: AssignDoiActionType.Error, payload: err.message });
			onError(err);
		}
	};

	const fetchDeposit = async () => {
		dispatch({ type: AssignDoiActionType.FetchDeposit });

		try {
			const body = JSON.stringify({
				target: target,
				pubId: pubData.id,
				communityId: communityData.id,
				...(contentVersion && { contentVersion: contentVersion }),
			});
			const response = await apiFetch('/api/doi', {
				method: 'POST',
				body: body,
			});
			dispatch({
				type: AssignDoiActionType.FetchDepositSuccess,
				payload: { depositJson: response },
			});

			onDeposit(response.dois[target]);
		} catch (err) {
			dispatch({ type: AssignDoiActionType.Error, payload: err.message });
			onError(err);
		}
	};

	const handlePreviewClick = () => fetchPreview();
	const handleDepositClick = () => fetchDeposit();
	const handleItemSelect = (item) => {
		const { key: nextContentVersion } = item;

		dispatch({
			type: AssignDoiActionType.UpdateContentVersion,
			payload: nextContentVersion,
		});

		// Immediately load preview with next content version.
		fetchPreview(nextContentVersion);
	};

	let handleButtonClick;

	if (status === AssignDoiStatus.Initial) {
		handleButtonClick = handlePreviewClick;
	} else if (status === AssignDoiStatus.Previewed) {
		handleButtonClick = handleDepositClick;
	}

	return (
		<div className="assign-doi-component">
			<InputField error={error && 'There was an error depositing the work.'}>
				<Button
					disabled={disabled || !handleButtonClick}
					text={getButtonText(status, pubData.crossrefDepositRecord)}
					loading={
						status === AssignDoiStatus.Previewing ||
						status === AssignDoiStatus.Depositing
					}
					onClick={handleButtonClick}
					icon={status === AssignDoiStatus.Deposited && 'tick'}
				/>
			</InputField>
			{status === AssignDoiStatus.Previewed && (
				<InputField label="Content Version">
					<Select
						items={contentVersionItems}
						itemRenderer={(item, { handleClick }) => (
							<MenuItem
								key={item.key}
								active={item === activeContentVersionItem}
								onClick={handleClick}
								text={<span>{item.title}</span>}
							/>
						)}
						onItemSelect={handleItemSelect}
						filterable={false}
						popoverProps={{ minimal: true }}
					>
						<Button
							text={<span>{activeContentVersionItem.title}</span>}
							rightIcon="caret-down"
						/>
					</Select>
				</InputField>
			)}
			{status === AssignDoiStatus.Previewed && (
				<>
					<p>
						Review the information below, then click the "Submit Deposit" button to
						submit the deposit to Crossref.
					</p>
					<AssignDoiPreview crossrefDepositRecord={result} />
				</>
			)}
		</div>
	);
}

AssignDoi.propTypes = propTypes;
AssignDoi.defaultProps = defaultProps;
export default AssignDoi;
