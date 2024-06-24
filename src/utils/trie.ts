class Trie<T> {
	value?: T;
	children: Map<string, Trie<T>>;

	constructor(value?: T) {
		this.value = value;
		this.children = new Map();
	}
}

export const buildTrie = <T>(entries: [string, T][]): Trie<T> => {
	const trie = new Trie<T>();

	entries.forEach(entry => {
		let curr = trie;
		let i = 0;
		while (i < entry[0].length) {
			if (!curr.children.has(entry[0][i])) {
				curr.children.set(entry[0][i], new Trie<T>());
			}
			curr = curr.children.get(entry[0][i++])!;
		}

		curr.value = entry[1];
	});

	return trie;
}