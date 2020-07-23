import LocalRepl from 'local-repl';
import path from 'path';

import { isProd } from 'utils/environment';

const historyFileName = isProd() ? '.pubpub_repl_history_prod' : '.pubpub_repl_history';
const historyPath = path.join(process.cwd(), historyFileName);

const main = async () => {
	const repl = await LocalRepl.start({ breakEvalOnSigint: true });
	repl.setupHistory(historyPath, () => {});
};

main();
