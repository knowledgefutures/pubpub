import { stubKfAuth, restoreKfAuth } from '../stubstub/kfAuth';

beforeAll(() => {
	stubKfAuth();
});

afterAll(() => {
	restoreKfAuth();
});
