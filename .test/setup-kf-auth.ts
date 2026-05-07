import { restoreKfAuth, stubKfAuth } from '../stubstub/kfAuth';

beforeAll(() => {
	stubKfAuth();
});

afterAll(() => {
	restoreKfAuth();
});
