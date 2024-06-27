import { buildTrie } from "../../utils/trie";

export enum TokenType {
	Literal = "Literal",
	EOF = "EOF",
	Semicolon = ";",
	BinaryOpType = "BinaryOp",
}

export enum LiteralType {
	Number = "Number",
	Identifier = "Identifier",
}

export enum BinaryOpType {
	Plus = "+",
	Minus = "-",
	Asterisk = "*",
	Slash = "/",
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

	// expect
	// 	Test whether tokenType matches expected
	// 	@params:
	// 		expected - list of expected types
	// 	@returns:
	//		Whether tokenType matches any of the expected types
	expect(expected: TokenType[]): boolean {
		return expected.some(t => t === this.tokenType);
	}
}

export class BinaryOpToken extends Token {
	binaryOp: BinaryOpType;

	constructor(binaryOp: BinaryOpType, line: number, column: number) {
		super(TokenType.BinaryOpType, line, column);

		this.binaryOp = binaryOp;
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
	[BinaryOpType.Plus]: 8,
	[BinaryOpType.Minus]: 8,
	[BinaryOpType.Asterisk]: 9,
	[BinaryOpType.Slash]: 9,
};

const SYMBOL_TOKENS: [string, TokenType|BinaryOpType][] = [
	['+', BinaryOpType.Plus],
	['-', BinaryOpType.Minus],
	['*', BinaryOpType.Asterisk],
	['/', BinaryOpType.Slash],
	[';', TokenType.Semicolon],
]

export const SymbolTokens = buildTrie(SYMBOL_TOKENS);