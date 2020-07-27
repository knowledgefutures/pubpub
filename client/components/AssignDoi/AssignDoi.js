import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

import AssignDoiPreview from './AssignDoiPreview';

require('./assignDoi.scss');

const noop = () => {};

const propTypes = {
	communityData: PropTypes.object.isRequired,
	disabled: PropTypes.bool,
	pubData: PropTypes.object.isRequired,
	hasExistingDeposit: PropTypes.bool,
	target: PropTypes.string.isRequired,
	onDeposit: PropTypes.func,
	onPreview: PropTypes.func,
	onError: PropTypes.func,
};

const defaultProps = {
	disabled: false,
	hasExistingDeposit: false,
	onPreview: noop,
	onDeposit: noop,
	onError: noop,
};

const AssignDoiState = {
	Initial: 'initial',
	Previewing: 'previewing',
	Previewed: 'previewed',
	Depositing: 'depositing',
	Deposited: 'deposited',
};

const AssignDoiActionType = {
	FetchPreview: 'fetch_preview',
	FetchPreviewSuccess: 'fetch_preview_success',
	FetchDeposit: 'fetch_deposit',
	FetchDepositSuccess: 'fetch_deposit_success',
	Error: 'error',
};

const buttonTextByState = {
	[AssignDoiState.Initial]: 'Assign DOI',
	[AssignDoiState.Previewing]: 'Getting Preview',
	[AssignDoiState.Previewed]: 'Submit Deposit',
	[AssignDoiState.Depositing]: 'Depositing',
	[AssignDoiState.Deposited]: 'DOI Deposited',
};

const getButtonText = (state, hasExistingDeposit) => {
	if (state === AssignDoiState.Initial && hasExistingDeposit) {
		return 'Resubmit DOI deposit';
	}

	return buttonTextByState[state];
};

export function reducer(state, action) {
	switch (action.type) {
		case AssignDoiActionType.FetchPreview:
			if (!(state.state === AssignDoiState.Initial || state.state === AssignDoiState.Error)) {
				return state;
			}

			return {
				state: AssignDoiState.Previewing,
				result: null,
				error: null,
			};
		case AssignDoiActionType.FetchPreviewSuccess:
			if (state.state !== AssignDoiState.Previewing) {
				return state;
			}

			return {
				state: AssignDoiState.Previewed,
				result: action.payload,
				error: null,
			};
		case AssignDoiActionType.FetchDeposit:
			if (state.state !== AssignDoiState.Previewed) {
				return state;
			}

			return {
				state: AssignDoiState.Depositing,
				result: null,
				error: null,
			};
		case AssignDoiActionType.FetchDepositSuccess:
			if (state.state !== AssignDoiState.Depositing) {
				return state;
			}

			return {
				state: AssignDoiState.Deposited,
				result: action.payload,
				error: null,
			};
		case AssignDoiActionType.Error:
			return {
				state: AssignDoiState.Initial,
				result: null,
				error: action.payload,
			};
		default:
			return state;
	}
}

const initialState = {
	state: AssignDoiState.Initial,
	preview: null,
	result: null,
};

function AssignDoi(props) {
	const {
		communityData,
		disabled,
		hasExistingDeposit,
		pubData,
		onPreview,
		onDeposit,
		onError,
		target,
	} = props;
	const [{ state, result }, dispatch] = useReducer(reducer, initialState);
	const fetchPreview = useCallback(async () => {
		dispatch({ type: AssignDoiActionType.FetchPreview });

		try {
			const params = new URLSearchParams({
				target: target,
				pubId: pubData.id,
				communityId: communityData.id,
			});
			const preview = await apiFetch(`/api/doiPreview?${params.toString()}`);

			onPreview(preview);

			dispatch({
				type: AssignDoiActionType.FetchPreviewSuccess,
				payload: preview,
			});
		} catch (error) {
			dispatch({ type: AssignDoiActionType.Error, payload: error.message });
			onError(error);
		}
	}, [communityData, pubData, target, onPreview, onError]);
	const fetchDeposit = useCallback(async () => {
		dispatch({ type: AssignDoiActionType.FetchDeposit });

		try {
			const body = JSON.stringify({
				target: target,
				pubId: pubData.id,
				communityId: communityData.id,
			});
			const response = await apiFetch('/api/doi', {
				method: 'POST',
				body: body,
			});
			const targetDoi = response.dois[target];

			dispatch({
				type: AssignDoiActionType.FetchDepositSuccess,
				payload: targetDoi,
			});

			onDeposit(targetDoi);
		} catch (error) {
			dispatch({ type: AssignDoiActionType.Error, payload: error.message });
			onError(error);
		}
	}, [communityData, pubData, target, onDeposit, onError]);

	let action;

	if (state === AssignDoiState.Initial) {
		action = fetchPreview;
	} else if (state === AssignDoiState.Previewed) {
		action = fetchDeposit;
	}

	return (
		<div className="assign-doi-component">
			<Button
				disabled={disabled || !action}
				text={getButtonText(state, hasExistingDeposit)}
				loading={state === AssignDoiState.Previewing || state === AssignDoiState.Depositing}
				onClick={action}
				icon={state === AssignDoiState.Deposited && 'tick'}
			/>
			{state === AssignDoiState.Previewed && (
				<>
					<p>
						Review the information below, then use the button above to submit the
						deposit to Crossref.
					</p>
					<AssignDoiPreview {...result} />
				</>
			)}
		</div>
	);
}

AssignDoi.propTypes = propTypes;
AssignDoi.defaultProps = defaultProps;
export default AssignDoi;
