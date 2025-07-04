import { Readable, ReadableOptions, Writable } from 'stream';

export class ReadableStreamClone extends Readable {
	constructor(readableStream: Readable, options?: ReadableOptions) {
		super(options);
		readableStream.on('data', (chunk) => {
			this.push(chunk);
		});

		readableStream.on('end', () => {
			this.push(null);
		});

		readableStream.on('error', (err) => {
			this.emit('error', err);
		});
	}

	public _read() {}
}

export const promisifyWriteStream = async (writableStream: Writable) => {
	return new Promise((resolve, reject) => {
		writableStream.on('finish', () => {
			resolve(null);
		});
		writableStream.on('error', (err) => {
			reject(err);
		});
	});
};

export const promisifyWriteStreams = async (writableStreams: Writable[]) => {
	return Promise.all(
		writableStreams.map((writable: Writable) => {
			return promisifyWriteStream(writable);
		}),
	);
};
