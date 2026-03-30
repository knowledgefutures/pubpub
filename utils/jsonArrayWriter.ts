import * as fs from 'fs';

/**
 * little utility that writes json objects to a file, keeping the file valid json at all times.
 */
export class JsonArrayWriter<T> {
	private fd: number;
	private count = 0;

	constructor(path: string) {
		this.fd = fs.openSync(path, 'w');
		fs.writeSync(this.fd, '[]');
	}

	push(entry: T): void {
		const json = JSON.stringify(entry, null, 2);
		const stat = fs.fstatSync(this.fd);
		// overwrite the trailing `]`
		const pos = stat.size - 1;
		const chunk = this.count === 0 ? `\n${json}\n]` : `,\n${json}\n]`;
		fs.writeSync(this.fd, chunk, pos);
		this.count++;
	}

	get length(): number {
		return this.count;
	}

	close(): void {
		fs.closeSync(this.fd);
	}
}
