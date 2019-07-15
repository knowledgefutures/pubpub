/* eslint-disable no-console, no-restricted-syntax */
const { Node } = require('prosemirror-model');
const stableStringify = require('json-stable-stringify');
const editorSchema = require('../util/editorSchema');

const jsonToDoc = (json) => Node.fromJSON(editorSchema, json);
const docToString = (doc) => stableStringify(doc.toJSON());

module.exports = { jsonToDoc: jsonToDoc, docToString: docToString };
