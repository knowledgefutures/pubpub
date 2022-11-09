/* eslint-disable jsx-a11y/label-has-for */
import React from 'react';
import { Classes } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import classNames from 'classnames';

require('./inputField.scss');

const propTypes = {
	autocomplete: PropTypes.string,
	children: PropTypes.node,
	defaultValue: PropTypes.string,
	error: PropTypes.string,
	helperText: PropTypes.node,
	htmlFor: PropTypes.string,
	inputRef: PropTypes.object,
	isDisabled: PropTypes.bool,
	isRequired: PropTypes.bool,
	isTextarea: PropTypes.bool,
	label: PropTypes.node,
	onBlur: PropTypes.func,
	onChange: PropTypes.func,
	placeholder: PropTypes.string,
	type: PropTypes.string,
	value: PropTypes.string,
	wrapperClassName: PropTypes.string,
};

const defaultProps = {
	autocomplete: undefined,
	children: undefined,
	defaultValue: undefined,
	error: undefined,
	helperText: '',
	htmlFor: '',
	inputRef: undefined,
	isDisabled: false,
	isRequired: false,
	isTextarea: false,
	label: undefined,
	onBlur: undefined,
	onChange: undefined,
	placeholder: undefined,
	type: 'text',
	value: undefined,
	wrapperClassName: '',
};

const InputField = function (props) {
	return (
		<div
			className={classNames(
				'input-field-component',
				Classes.FORM_GROUP,
				props.wrapperClassName,
				props.error ? Classes.INTENT_DANGER : '',
			)}
		>
			<label className={Classes.LABEL} htmlFor={`input-${props.htmlFor || props.label}`}>
				{props.label}
				{props.isRequired && (
					<span className={`${Classes.TEXT_MUTED} required-text`}> (required)</span>
				)}
			</label>
			<div className={Classes.FORM_CONTENT}>
				{props.children}
				<div
					className={`${Classes.INPUT_GROUP} ${props.error ? Classes.INTENT_DANGER : ''}`}
				>
					{!props.children && !props.isTextarea && (
						<input
							id={`input-${props.htmlFor || props.label}`}
							className={Classes.INPUT}
							disabled={props.isDisabled}
							placeholder={props.placeholder}
							value={props.value}
							defaultValue={props.defaultValue}
							onChange={props.onChange}
							onBlur={props.onBlur}
							type={props.type}
							autoComplete={props.autocomplete}
							dir="auto"
							ref={props.inputRef}
						/>
					)}
					{!props.children && props.isTextarea && (
						<textarea
							id={`input-${props.label}`}
							className={Classes.INPUT}
							disabled={props.isDisabled}
							placeholder={props.placeholder}
							value={props.value}
							defaultValue={props.defaultValue}
							onChange={props.onChange}
							onBlur={props.onBlur}
							// @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; className: string; disabled: a... Remove this comment to see the full error message
							type={props.type}
							dir="auto"
							ref={props.inputRef}
						/>
					)}
					<div className={Classes.FORM_HELPER_TEXT}>
						{props.error || props.helperText}
					</div>
				</div>
			</div>
		</div>
	);
};

InputField.defaultProps = defaultProps;
InputField.propTypes = propTypes;
export default InputField;
