/* eslint-disable jsx-a11y/label-has-for */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

require('./inputField.scss');

const propTypes = {
	autocomplete: PropTypes.string,
	children: PropTypes.node,
	defaultValue: PropTypes.string,
	error: PropTypes.string,
	helperText: PropTypes.node,
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

const InputField = function(props) {
	return (
		<div
			className={classNames(
				'input-field-component',
				'bp3-form-group',
				props.wrapperClassName,
				props.error ? 'bp3-intent-danger' : '',
			)}
		>
			<label className="bp3-label" htmlFor={`input-${props.label}`}>
				{props.label}
				{props.isRequired && (
					<span className="bp3-text-muted required-text"> (required)</span>
				)}
			</label>
			<div className="bp3-form-content">
				{props.children}
				<div className={`bp3-input-group ${props.error ? 'bp3-intent-danger' : ''}`}>
					{!props.children && !props.isTextarea && (
						<input
							id={`input-${props.label}`}
							className="bp3-input"
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
							className="bp3-input"
							disabled={props.isDisabled}
							placeholder={props.placeholder}
							value={props.value}
							defaultValue={props.defaultValue}
							onChange={props.onChange}
							onBlur={props.onBlur}
							type={props.type}
							dir="auto"
							ref={props.inputRef}
						/>
					)}
					<div className="bp3-form-helper-text">{props.error || props.helperText}</div>
				</div>
			</div>
		</div>
	);
};

InputField.defaultProps = defaultProps;
InputField.propTypes = propTypes;
export default InputField;
