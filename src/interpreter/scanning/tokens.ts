import { buildTrie } from "../../utils/trie";

export enum TokenType {
	Literal = "Literal",
	EOF = "EOF",
	Semicolon = ";",
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
	line: number;
	column: number;
	value?: string|number;

	constructor(tokenType: TokenType, line: number, column: number, value?: string|number) {
		this.tokenType = tokenType;
		this.line = line;
		this.column = column;
		this.value = value;
	}
}

export class Literal extends Token {
	literalType: LiteralType;

	constructor(literalType: LiteralType, line: number, column: number, value: string|number) {
		super(TokenType.Literal, line, column, value);
		this.literalType = literalType;
	}
}

export const OPERATOR_PRECEDENCE: Record<string, number> = {
	[TokenType.Plus]: 8,
	[TokenType.Minus]: 8,
	[TokenType.Asterisk]: 9,
	[TokenType.Slash]: 9,
};

const SYMBOL_TOKENS: [string, TokenType][] = [
	['+', TokenType.Plus],
	['-', TokenType.Minus],
	['*', TokenType.Asterisk],
	['/', TokenType.Slash],
	[';', TokenType.Semicolon],
]

export const SymbolTokens = buildTrie(SYMBOL_TOKENS);