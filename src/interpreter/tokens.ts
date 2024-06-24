import { buildTrie } from "../utils/trie";

export enum TokenType {
	Literal = "Literal",
	EOF = "EOF",
	Plus = "+",
	Minus = "-",
	Asterisk = "*",
	Slash = "/",
}

export enum LiteralType {
	Number = "Number",
	Identifier = "Identifier",
}

export class Token {
	tokenType: TokenType;
	value?: string|number;

	constructor(tokenType: TokenType, value?: string|number) {
		this.tokenType = tokenType;
		this.value = value;
	}
}

export class Literal extends Token {
	literalType: LiteralType;

	constructor(literalType: LiteralType, value: string|number) {
		super(TokenType.Literal, value);
		this.literalType = literalType;
	}
}

const SYMBOL_TOKENS: [string, TokenType][] = [
	['+', TokenType.Plus],
	['-', TokenType.Minus],
	['*', TokenType.Asterisk],
	['/', TokenType.Slash],
]

export const symbolTokens = buildTrie(SYMBOL_TOKENS);