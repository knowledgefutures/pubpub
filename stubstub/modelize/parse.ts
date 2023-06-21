import fs from 'fs';
import path from 'path';
import pegjs from 'pegjs';
import { AST } from './link';

const grammar = fs.readFileSync(path.join(__dirname, '/grammar.pegjs')).toString();
const parser = pegjs.generate(grammar);

export const parse = (str: string): AST => parser.parse(str);
