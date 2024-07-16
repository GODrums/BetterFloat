// This queue implementation uses a map to store the items and a head and tail pointer to keep track of the queue.
// This guarantees constant time enqueue and dequeue operations, but has a high reset cost.
// https://trungvose.com/experience/typescript-queue/
export class AltQueue<T> {
	private _queue: {
		[key: number]: T;
	};
	private _head: number;
	private _tail: number;

	constructor() {
		this._queue = {};
		this._head = 0;
		this._tail = 0;
	}

	get isEmpty() {
		return this.size === 0;
	}

	get size() {
		return this._tail - this._head;
	}

	enqueue(value: T): void {
		this._queue[this._tail] = value;
		this._tail++;
	}

	dequeue(): T | undefined {
		if (this.isEmpty) {
			return undefined;
		}
		const value = this._queue[this._head];
		delete this._queue[this._head];
		this._head++;
		return value;
	}

	reset(values: T[]): void {
		this._queue = {};
		this._head = 0;
		this._tail = 0;
		values.forEach((value, index) => {
			this._queue[index] = value;
		});
		this._tail = values.length;
	}

	peek(): T | undefined {
		if (this.isEmpty) {
			return undefined;
		}
		return this._queue[this._head];
	}

	clear(): void {
		this._queue = {};
		this._head = 0;
		this._tail = 0;
	}
}

export class Queue<T> {
	private items: T[];

	constructor() {
		this.items = [];
	}

	get isEmpty() {
		return this.items.length === 0;
	}

	get size() {
		return this.items.length;
	}

	/**
	 * Deletes all items and replaces them with the given items.
	 * Guarantees idempotency - the original data is not altered.
	 * @param items
	 */
	reset(items: T[]): void {
		this.items = items.slice();
	}

	/**
	 * Adds an item to the end of the queue
	 * @param item
	 */
	enqueue(item: T): void {
		this.items.push(item);
	}

	/**
	 * Get the first item and remove it from the queue or undefined if the queue is empty
	 * @returns
	 */
	dequeue(): T | undefined {
		return this.items.shift();
	}

	/**
	 * Get the first item without removing it from the queue
	 * @returns
	 */
	peek(): T | undefined {
		return this.items[0];
	}
}

export default { Queue, AltQueue };
