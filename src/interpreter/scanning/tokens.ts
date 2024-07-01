import { buildTrie } from "../../utils/trie";

export enum TokenType {
	Literal = "Literal",
	EOF = "EOF",
	Semicolon = ";",
	Plus = "+",
	Minus = "-",
	Asterisk = "*",
	Slash = "/",
	LeftParen = "(",
	RightParen = ")",
	Asterisk2 = "**",
	Bang = "!",
	True = "true",
	False = "false",
}

export enum LiteralType {
	Number = "Number",
	String = "String",
	Boolean = "Boolean",
	Identifier = "Identifier",
}

export class Token {
	tokenType: TokenType;
	line: number;
	column: number;
	value?: string|number|boolean;

	constructor(tokenType: TokenType, line: number, column: number, value?: string|number|boolean) {
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
	[TokenType.Asterisk2]: 13,
};

const SYMBOL_TOKENS: [string, TokenType][] = [
	['+', TokenType.Plus],
	['-', TokenType.Minus],
	['*', TokenType.Asterisk],
	['/', TokenType.Slash],
	[';', TokenType.Semicolon],
	['(', TokenType.LeftParen],
	[')', TokenType.RightParen],
	['**', TokenType.Asterisk2],
	['!', TokenType.Bang],
]

const KEYWORD_TOKENS: [string, TokenType][] = [
	['true', TokenType.True],
	['false', TokenType.False]
]

export const RL_ASSOCIATIVE_TOKENS = {
	[TokenType.Asterisk2]: true,
}

export const UNARY_TOKENS = {
	[TokenType.Minus]: true,
	[TokenType.Bang]: true
}

export const SymbolTokens = buildTrie(SYMBOL_TOKENS);
export const KeywordTokens = buildTrie(KEYWORD_TOKENS);