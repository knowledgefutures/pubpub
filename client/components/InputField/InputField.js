/* eslint-disable jsx-a11y/label-has-for */import React from 'react';
import PropTypes from 'prop-types';

require('./inputField.scss');

const propTypes = {
	label: PropTypes.string,
	placeholder: PropTypes.string,
	isRequired: PropTypes.bool,
	isDisabled: PropTypes.bool,
	isTextarea: PropTypes.bool,
	helperText: PropTypes.node,
	error: PropTypes.string,
	value: PropTypes.string,
	type: PropTypes.string,
	autocomplete: PropTypes.string,
	wrapperClassName: PropTypes.string,
	inputRef: PropTypes.object,
	onChange: PropTypes.func,
	children: PropTypes.node,
};

const defaultProps = {
	label: undefined,
	placeholder: undefined,
	isRequired: false,
	isDisabled: false,
	isTextarea: false,
	helperText: '',
	error: undefined,
	value: undefined,
	type: 'text',
	autocomplete: undefined,
	wrapperClassName: '',
	inputRef: undefined,
	onChange: undefined,
	children: undefined,
};

const InputField = function(props) {
	return (
		<div className={`input-field-component bp3-form-group ${props.error ? 'bp3-intent-danger' : ''} ${props.wrapperClassName}`}>
			<label className="bp3-label" htmlFor={`input-${props.label}`}>
				{props.label}
				{props.isRequired &&
					<span className="bp3-text-muted required-text"> (required)</span>
				}
			</label>
			<div className="bp3-form-content">
				{props.children}
				<div className={`bp3-input-group ${props.error ? 'bp3-intent-danger' : ''}`}>
					{!props.children && !props.isTextarea &&
						<input
							id={`input-${props.label}`}
							className="bp3-input"
							disabled={props.isDisabled}
							placeholder={props.placeholder}
							value={props.value}
							onChange={props.onChange}
							type={props.type}
							autoComplete={props.autocomplete}
							dir="auto"
							ref={props.inputRef}
						/>
					}
					{!props.children && props.isTextarea &&
						<textarea
							id={`input-${props.label}`}
							className="bp3-input"
							disabled={props.isDisabled}
							placeholder={props.placeholder}
							value={props.value}
							onChange={props.onChange}
							type={props.type}
							dir="auto"
							ref={props.inputRef}
						/>
					}
					<div className="bp3-form-helper-text">{props.error || props.helperText}</div>
				</div>

			</div>
		</div>
	);
};

InputField.defaultProps = defaultProps;
InputField.propTypes = propTypes;
export default InputField;
