import { asyncForEach, asyncMap } from 'utils/async';

describe('async utils', () => {
	beforeAll(() => jest.useFakeTimers());
	afterAll(() => jest.useRealTimers());
	describe('asyncForEach', () => {
		it('sequentially executes a callback for each promise with the resolved value, current index, and array length', async () => {
			const promises = [
				Promise.resolve(1),
				Promise.resolve(2),
				Promise.resolve(3),
				Promise.resolve(4),
			];
			jest.runAllTimers();
			const done: boolean[] = [];
			const results: number[] = [];
			let i = 0;
			await asyncForEach(promises, (value, index, length) => {
				expect(index).toBe(i++);
				expect(length).toBe(promises.length);
				if (index > 0) {
					expect(done[index - 1]).toBe(true);
				}
				done[index] = true;
				results.push(value);
			});
			jest.runAllTimers();
			expect(results).toEqual([1, 2, 3, 4]);
		});
		it('awaits a list of promises', async () => {
			const promises = Promise.resolve([Promise.resolve(1), Promise.resolve(2)]);
			const results: number[] = [];
			jest.runAllTimers();
			await asyncForEach(promises, (value) => results.push(value));
			expect(results).toEqual([1, 2]);
		});
		it('throws an error when a promise is rejected', async () => {
			const error = new Error();
			const promises = Promise.resolve([
				Promise.resolve(1),
				Promise.reject(error),
				Promise.resolve(3),
			]);
			const results: number[] = [];
			jest.runAllTimers();
			await expect(asyncForEach(promises, (value) => results.push(value))).rejects.toEqual(
				error,
			);
			expect(results).toEqual([1]);
		});
	});
	describe('asyncMap', () => {
		it('produces a new array using the values returned from a function called with each resolved value of an array of promises', async () => {
			const promises = Promise.resolve([
				Promise.resolve(1),
				Promise.resolve(2),
				Promise.resolve(3),
			]);
			const results = await asyncMap(promises, (n) => Promise.resolve(n + 1));
			expect(results).toEqual([2, 3, 4]);
		});
		it('uses its concurrency option to process multiple values in parallel', async () => {
			const tick = () => new Promise(setImmediate);
			const config = { concurrency: 2 };
			const values = [0, 1, 2, 3, 4];
			const pending: Function[] = [];
			const resolve = (n: number) => {
				pending[n]();
				return tick();
			};
			const iteratee = (n: number) =>
				new Promise((r) => {
					pending[n] = r;
				}).then(() => {
					delete pending[n];
				});
			let done = false;
			asyncMap(values, iteratee, config).then(() => {
				done = true;
			});
			await tick();
			expect(pending[0]).toBeInstanceOf(Function);
			expect(pending[1]).toBeInstanceOf(Function);
			expect(pending[2]).toBe(undefined);
			expect(pending[3]).toBe(undefined);
			expect(pending[4]).toBe(undefined);
			expect(done).toBe(false);
			await resolve(0);
			expect(pending[0]).toBe(undefined);
			expect(pending[1]).toBeInstanceOf(Function);
			expect(pending[2]).toBeInstanceOf(Function);
			expect(pending[3]).toBe(undefined);
			expect(pending[4]).toBe(undefined);
			expect(done).toBe(false);
			await resolve(1);
			await resolve(2);
			expect(pending[0]).toBe(undefined);
			expect(pending[1]).toBe(undefined);
			expect(pending[2]).toBe(undefined);
			expect(pending[3]).toBeInstanceOf(Function);
			expect(pending[4]).toBeInstanceOf(Function);
			expect(done).toBe(false);
			await resolve(4);
			expect(pending[0]).toBe(undefined);
			expect(pending[1]).toBe(undefined);
			expect(pending[2]).toBe(undefined);
			expect(pending[3]).toBeInstanceOf(Function);
			expect(pending[4]).toBe(undefined);
			expect(done).toBe(false);
			await resolve(3);
			expect(pending[0]).toBe(undefined);
			expect(pending[1]).toBe(undefined);
			expect(pending[2]).toBe(undefined);
			expect(pending[3]).toBe(undefined);
			expect(pending[4]).toBe(undefined);
			expect(done).toBe(true);
		});
	});
});
