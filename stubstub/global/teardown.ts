// (this global is defined next door in setup.js)

import { ChildProcessWithoutNullStreams } from 'child_process';

declare namespace global {
	let testDbServerProcess: ChildProcessWithoutNullStreams | undefined;
}

export default async () => {
	if (global.testDbServerProcess) {
		global.testDbServerProcess.kill();
	}
};
