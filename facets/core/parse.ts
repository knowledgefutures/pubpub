import { FacetDefinition, FacetInstanceType } from './facet';
import { FacetParseError } from './errors';

type ParseResult<
	ParsedRecordType extends Record<string, any>,
	ThrowErrorOnFailure extends boolean,
> = {
	valid: ThrowErrorOnFailure extends true ? ParsedRecordType : Partial<ParsedRecordType>;
	invalid: Partial<Record<keyof ParsedRecordType, true>>;
};

function parsePartialOrEntireFacetInstance<
	Def extends FacetDefinition,
	InstanceKey extends keyof Def['props'],
	AllowPartialInstance extends boolean,
	ThrowErrorOnFailure extends boolean,
	ParsedType = Pick<FacetInstanceType<Def>, InstanceKey>,
>(
	definition: Def,
	instance: Record<InstanceKey, any>,
	throwErrorOnFailure: ThrowErrorOnFailure,
	allowPartialInstance: AllowPartialInstance,
): ParseResult<ParsedType, ThrowErrorOnFailure> {
	const { props } = definition;
	const valid: Partial<ParsedType> = {};
	const invalid: Partial<Record<keyof ParsedType, true>> = {};
	const instanceKeys = Object.keys(instance);
	Object.entries(props).forEach(([propName, prop]) => {
		const instanceHasKey = instanceKeys.includes(propName);
		if (instanceHasKey) {
			const propSchema = prop.propType.schema;
			const instanceValue = instance[propName];
			if (instanceValue === null) {
				valid[propName as any] = null;
			} else {
				const parsedValue = propSchema.safeParse(instanceValue);
				if (parsedValue.success) {
					valid[propName as any] = parsedValue.data;
				} else {
					invalid[propName as any] = true;
				}
			}
		} else if (!allowPartialInstance) {
			throw new FacetParseError(definition, propName);
		}
	});
	if (throwErrorOnFailure) {
		const invalidKeys = Object.keys(invalid);
		if (invalidKeys.length > 0) {
			throw new FacetParseError(definition, invalidKeys);
		}
		const returnValue: ParseResult<ParsedType, true> = { valid: valid as ParsedType, invalid };
		return returnValue as ParseResult<ParsedType, ThrowErrorOnFailure>;
	}
	const returnValue: ParseResult<ParsedType, false> = { valid, invalid };
	return returnValue as ParseResult<ParsedType, ThrowErrorOnFailure>;
}

export function parsePartialFacetInstance<
	Def extends FacetDefinition,
	InstanceKey extends keyof Def['props'],
	ThrowErrorOnFailure extends boolean,
>(
	definition: Def,
	instance: Record<InstanceKey, any>,
	throwErrorOnFailure: ThrowErrorOnFailure = false as ThrowErrorOnFailure,
) {
	return parsePartialOrEntireFacetInstance(definition, instance, throwErrorOnFailure, true);
}

export function parseFacetInstance<
	Def extends FacetDefinition,
	ThrowErrorOnFailure extends boolean,
>(
	definition: Def,
	instance: Record<keyof Def['props'], any>,
	throwErrorOnFailure: ThrowErrorOnFailure = false as ThrowErrorOnFailure,
) {
	return parsePartialOrEntireFacetInstance(definition, instance, throwErrorOnFailure, false);
}
