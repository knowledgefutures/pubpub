import { DocJson, Maybe } from 'types';
import { isEmptyDoc } from 'components/Editor';
import { isValidEmail } from 'utils/email';

type AnyRecord = Record<string, any>;

export type FieldValidator<Field> = (value: Field) => boolean;

export type RecordValidator<Rec extends AnyRecord> = {
	[K in keyof Rec]: FieldValidator<Rec[K]>;
};

export type ValidatedFields<Rec> = { [K in keyof Rec]: boolean };

export type ValidationResult<Rec extends AnyRecord> = {
	isValidated: boolean;
	validatedFields: ValidatedFields<Rec>;
};

export const isNonEmptyString = (str: string) => typeof str === 'string' && str.length > 0;

export const isNonEmptyDocJson = (docJson: DocJson) => {
	return !isEmptyDoc(docJson);
};

export const isAlwaysValid = () => true;

export const isTruthyAnd = <T>(
	validator: FieldValidator<T>,
	fallback = false,
): FieldValidator<Maybe<T>> => {
	return (value: Maybe<T>) => {
		if (value) {
			return validator(value as T);
		}
		return fallback;
	};
};

export const isValidEmailList = (emailList: string[]) =>
	!!emailList.length && emailList.every((emailAddress) => isValidEmail(emailAddress));

export const validate = <Rec extends AnyRecord>(
	rec: Rec,
	validator: RecordValidator<Rec>,
	requireFullRecord = false,
): ValidationResult<Rec> => {
	const validatedFields = Object.entries(rec).reduce(
		(partial: Partial<ValidatedFields<Rec>>, [key, value]) => {
			const fieldValidator = validator[key];
			if (fieldValidator) {
				return {
					...partial,
					[key]: fieldValidator(value),
				};
			}
			return partial;
		},
		{},
	) as ValidatedFields<Rec>;
	const isValidated = requireFullRecord
		? Object.keys(validator).every((key) => validatedFields[key])
		: !Object.values(validatedFields).some((val) => !val);
	return {
		validatedFields,
		isValidated,
	};
};
