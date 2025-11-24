/** biome-ignore-all lint/performance/noAwaitInLoops: shhhhhh */
import { lstat, readdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import vm from 'vm';

function findBetweenBraces(input: string, square = false): string {
	let count = 0;
	let startIndex = -1;

	for (let i = 0; i < input.length; i++) {
		if (input[i] === (square ? '[' : '{')) {
			count++;
			if (startIndex === -1) {
				startIndex = i;
			}
		} else if (input[i] === (square ? ']' : '}')) {
			count--;
			if (count === 0) {
				return input.substring(startIndex + 1, i);
			}
		}
	}

	return '';
}

function convertContent(content: string) {
	// Sequelize to Sequelize-typescript transformations happen here
	// Initial transformations
	const newContent = content
		.replace(/import { DataTypes as dataTypes } from 'sequelize';/, '')
		.replace(/import { sequelize } from '..\/sequelize';/, '')
		.replace(/import .* from.*/g, '');
	// .replace(/export const /, '')
	// .replace(
	// 	/sequelize\.define\(\s*'(.*?)',/ms,
	// 	'@Table\nexport class $1 extends Model<InferAttributes<$1>, InferCreationAttributes<$1>>',
	// )
	// .replace(/,\s*{[^}]*},\s*{/g, ' {')
	// .replace(/\s*as any;\s*$/, '');

	const modelName = newContent.match(/export const (\w+) =/)?.[1];

	const firstLine = `export class ${modelName} extends Model<InferAttributes<${modelName}>, InferCreationAttributes<${modelName}>> {\n`;

	const imports = new Set<string>(['Model', 'Table', 'Column', 'DataType', 'PrimaryKey']);
	const sequelizeImports = new Set<string>([
		'InferAttributes',
		'InferCreationAttributes',
		'CreationOptional',
	]);

	const rawProperties = findBetweenBraces(newContent);

	let properties = rawProperties
		.replace(/dataTypes\.(.*?\))/g, '"DataType.$1"')
		.replace(/dataTypes\.(\w*)/g, '"DataType.$1"')
		.replace(/sequelize\.(\w*)/g, '"sequelize.$1"')
		.replace(/NOW/g, 'DataType.NOW');
	try {
		properties = vm.runInNewContext(`({${properties}})`);
	} catch (e) {
		console.error(e);

		throw new Error(`Unable to parse properties for ${e}`);
	}

	const typescriptTypeMapping = {
		TEXT: 'string',
		UUID: 'string',
		BOOLEAN: 'boolean',
		JSONB: 'object',
		STRING: 'string',
		ENUM: 'string',
		DOUBLE: 'number',
		INTEGER: 'number',
		DATE: 'Date',
	};

	const indexes = findBetweenBraces(content.replace(rawProperties, ''), true);

	const indexDefs = vm.runInNewContext(`[${indexes}]`);

	const indexIndex = indexDefs
		.flatMap((index: any) => {
			if (!index.fields) {
				return;
			}

			const { fields, ...options } = index;

			if (fields.length > 1) {
				return fields.map((field: string) => [
					field,
					{ ...options, name: `${modelName}_${fields.join('_')}` },
				]);
			}

			const field = fields[0];

			return [[field, options]];
		})
		.filter(Boolean)
		.reduce((acc: any, [field, options]: any) => {
			if (acc[field]) {
				acc[field] = Array.isArray(acc[field])
					? [...acc[field], options]
					: [acc[field], options];
				return acc;
			}

			acc[field] = options;
			return acc;
		}, {});
	console.log(modelName, indexIndex);

	const newProperties = (
		Object.entries(properties as any) as [
			key: string,
			props: {
				type: string;
				allowNull?: boolean;
				defaultValue?: string;
				unique?: boolean;
				validate?: any;
				values?: string[];
			},
		][]
	).map(([key, props]) => {
		let newProps = '';

		let nullable = true;
		let createOptional = false;

		if (key === 'id') {
			imports.add('Default');
			newProps += '\t@Default(DataType.UUIDV4)\n';
			newProps += '\t@PrimaryKey\n';
			newProps += '\t@Column(DataType.UUID)\n';
			newProps += '\tid!: CreationOptional<string>;';
			return newProps;
		}

		if (indexIndex[key]) {
			const index = indexIndex[key];
			(Array.isArray(index) ? index : [index]).forEach((index: any) => {
				newProps += `\t@Index(${JSON.stringify(index)})\n`;
			});
			imports.add('Index');
		}

		if (props.allowNull === false) {
			newProps += '\t@AllowNull(false)\n';
			imports.add('AllowNull');

			nullable = false;
		}

		if (props.validate) {
			if (props.validate.isLowercase) {
				newProps += '\t@IsLowercase\n';
				imports.add('IsLowercase');
			}

			if (props.validate.len) {
				newProps += `\t@Length({ min: ${props.validate.len[0]}, max: ${props.validate.len[1]} })\n`;
				imports.add('Length');
			}

			if (props.validate.isEmail) {
				newProps += '\t@IsEmail\n';
				imports.add('IsEmail');
			}

			if (props.validate.is) {
				newProps += `\t@Is(${props.validate.is})\n`;
				imports.add('Is');
			}
		}

		if (props.defaultValue !== undefined) {
			newProps += `\t@Default(${JSON.stringify(props.defaultValue)})\n`;
			imports.add('Default');

			createOptional = true;
		}

		if (props.unique) {
			newProps += `\t@Unique\n`;
			imports.add('Unique');
		}

		let type = props.type;

		if (props.values) {
			type = `DataType.ENUM(${props.values
				.map((value: string) => JSON.stringify(value))
				.join(', ')})`;
		}

		const typeName = type?.replace(/DataType\.(\w+).*/, '$1');

		return `${newProps}\t@Column(${type})\n\t${key}${nullable ? '?' : '!'}: ${
			createOptional ? 'CreationOptional<' : ''
		}${typescriptTypeMapping[typeName]}${nullable ? ' | null' : ''}${
			createOptional ? '>' : ''
		};`;
	});

	// Convert associate method
	const associations = Array.from(
		newContent.matchAll(/(hasMany|hasOne|belongsTo|belongsToMany)\((.*?), {([^)]*?)}\);/g),
	);

	const serverImports = new Set<string>();

	const foreignKeys = new Set<string>();

	const newAssociations = associations.map((association) => {
		const associationType = association[1]?.replace(/^\w/, (c) => c.toUpperCase());

		imports.add(associationType);

		const procAssoc = findBetweenBraces(association[0]);

		const properties = vm.runInNewContext(`({${procAssoc}})`);

		const associatedModel = association[2]?.replace(/^\w/, (c) => c.toUpperCase());

		const { as: asMatch, through, foreignKey } = properties;

		const maybeArray = /Many/.test(associationType) ? '[]' : '';

		if (through) {
			serverImports.add(through);
		}

		if (foreignKey && /BelongsTo\b/.test(associationType)) {
			foreignKeys.add(foreignKey?.name ?? foreignKey);
		}

		if (asMatch) {
			serverImports.add(associatedModel);
			const throughStatement =
				//	associationType === 'BelongsToMany' && through ? `, () => ${through}` : '';
				'';
			return `\t@${associationType}(() => ${associatedModel}${throughStatement}, ${
				JSON.stringify(properties).replace(/"through":"(\w+)"/, '"through": () => $1')
				// foreignKey || onDelete
				// 	? `, { ${foreignKey ? `foreignKey: ${JSON.stringify(foreignKey)}` : ''}${
				// 			onDelete
				// 				? `${foreignKey ? ', ' : ''}onDelete: ${JSON.stringify(onDelete)}`
				// 				: ''
				// 	  } }`
				// 	: ''
			})\n\t${asMatch}?: ${associatedModel}${maybeArray};`;
		}

		return '';
	});

	const foreignKeyColumns = Array.from(foreignKeys)
		.map((key) => {
			let indexDecl = '';
			if (properties[key]) {
				console.log(`Skipping foreign key column ${key} because it is already defined`);
				return;
			}

			if (indexIndex[key]) {
				const index = indexIndex[key];

				indexDecl += `\t@Index(${JSON.stringify(index)})\n`;
				imports.add('Index');
			}

			return `${indexDecl}\t@Column(DataType.UUID)\n\t${key}?: string | null;`;
		})
		?.filter(Boolean)
		?.join('\n\n');

	const missed = /classMethods/.test(newContent) && !associations.length;

	if (missed) {
		console.error(content);
		throw new Error(`Missed associations for ${modelName}`);
	}
	// 	(newContent = newContent?.replace(/,/g, (_match, associations) => {
	// 		const associationMapping: { [key: string]: string } = {
	// 			hasMany: 'HasMany',
	// 			hasOne: 'HasOne',
	// 			belongsTo: 'BelongsTo',
	// 			belongsToMany: 'BelongsToMany',
	// 		};
	// 		let associationDefs = '';
	// 		const regex = /\.(\w+)\((\w+), {([^}]*)}\);/g;
	// 		let match;
	// 		while ((match = regex.exec(associations))) {
	// 			const associationType = match[1];
	// 			const associatedModel = match[2];
	// 			const options = match[3];
	// 			const asMatch = options.match(/as: '(\w+)'/);
	// 			if (asMatch) {
	// 				associationDefs += `\t@${associationMapping[associationType]}(() => ${associatedModel})\n\t${asMatch[1]}?: ${associatedModel}[];\n`;
	// 			}
	// 		}
	// 		return associationDefs;
	// 	})),
	// );

	const sequelizeTypescriptImportsString = `import { ${Array.from(imports).join(
		', ',
	)} } from 'sequelize-typescript';`;
	const sequelizeImportsString = `import type { ${Array.from(sequelizeImports).join(
		', ',
	)} } from 'sequelize';`;
	const serverImportsString = serverImports.size
		? `import { ${Array.from(serverImports).join(', ')} } from '../models';`
		: '';

	return (
		sequelizeTypescriptImportsString +
		'\n' +
		sequelizeImportsString +
		'\n' +
		serverImportsString +
		'\n\n' +
		'@Table\n' +
		firstLine +
		'\n' +
		newProperties.join('\n\n') +
		'\n\n' +
		foreignKeyColumns +
		'\n\n' +
		newAssociations.join('\n\n') +
		//	newContent +
		'\n}'
	);
}

async function convertSequelizeFile(filePath: string) {
	try {
		const newFilePath = filePath.replace(/(\w*?)\.ts$/, 'new-$1.ts');
		const oldContent = await readFile(filePath, 'utf-8');

		const newContent = convertContent(oldContent);
		//	await rename(filePath, oldFilePath);
		await writeFile(newFilePath, newContent);
	} catch (err) {
		console.error(`Failed to convert file: ${filePath}`, err);
	}
}

const parseDirectory = async (dir: string) => {
	const files = await readdir(dir);
	for (const file of files) {
		const absoluteFilePath = path.join(dir, file);
		const fileStat = await lstat(absoluteFilePath);
		if (fileStat.isDirectory()) {
			await parseDirectory(absoluteFilePath);
		} else if (
			path.extname(file) === '.ts' &&
			(file === 'model.ts' || file === 'facetBinding.ts' || file === 'facetDefinition.ts')
		) {
			await convertSequelizeFile(absoluteFilePath);
		}
	}
};

// Provide your path here
parseDirectory('server/');
