import fs from 'fs';
import path from 'path';
import pegjs from 'pegjs';

const grammar = fs.readFileSync(path.join(__dirname, '/grammar.pegjs')).toString();
const parser = pegjs.generate(grammar);

export const parse = (str) => parser.parse(str);
