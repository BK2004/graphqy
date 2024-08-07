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
	Comma = ",",
	Asterisk2 = "**",
	LessThan = "<",
	LessThanEquals = "<=",
	GreaterThan = ">",
	GreaterThanEquals = ">=",
	NotEquals = "!=",
	Equals = "=",
	Equals2 = "==",
	Not = "not",
	And = "and",
	Or = "or",
	True = "true",
	False = "false",
	Var = "var",
	Const = "const",
	Block = "block",
	End = "end",
	If = "if",
	Then = "then",
	Else = "else",
	ElseIf = "elseif",
	While = "while",
	Do = "do",
	Repeat = "repeat",
	Until = "until",
	Break = "break",
	Continue = "continue",
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

// Follows lua precedence (https://www.lua.org/pil/3.5.html)
export const OPERATOR_PRECEDENCE: Record<string, number> = {
	[TokenType.Asterisk2]: 13,
	[TokenType.Asterisk]: 12,
	[TokenType.Slash]: 12,
	[TokenType.Plus]: 11,
	[TokenType.Minus]: 11,
	[TokenType.LessThan]: 10,
	[TokenType.LessThanEquals]: 10,
	[TokenType.GreaterThan]: 10,
	[TokenType.GreaterThanEquals]: 10,
	[TokenType.NotEquals]: 10,
	[TokenType.Equals2]: 10,
};

const SYMBOL_TOKENS: [string, TokenType][] = [
	['+', TokenType.Plus],
	['-', TokenType.Minus],
	['*', TokenType.Asterisk],
	['/', TokenType.Slash],
	[';', TokenType.Semicolon],
	['(', TokenType.LeftParen],
	[')', TokenType.RightParen],
	[',', TokenType.Comma],
	['<', TokenType.LessThan],
	['<=', TokenType.LessThanEquals],
	['>', TokenType.GreaterThan],
	['>=', TokenType.GreaterThanEquals],
	['!=', TokenType.NotEquals],
	['=', TokenType.Equals],
	['==', TokenType.Equals2],
	['**', TokenType.Asterisk2],
]

const KEYWORD_TOKENS: [string, TokenType][] = [
	['true', TokenType.True],
	['false', TokenType.False],
	['not', TokenType.Not],
	['and', TokenType.And],
	['or', TokenType.Or],
	['var', TokenType.Var],
	['const', TokenType.Const],
	['block', TokenType.Block],
	['end', TokenType.End],
	['if', TokenType.If],
	['then', TokenType.Then],
	['else', TokenType.Else],
	['elseif', TokenType.ElseIf],
	['while', TokenType.While],
	['do', TokenType.Do],
	['repeat', TokenType.Repeat],
	['until', TokenType.Until],
	['break', TokenType.Break],
	['continue', TokenType.Continue],
]

export const RL_ASSOCIATIVE_TOKENS = {
	[TokenType.Asterisk2]: true,
}

export const UNARY_TOKENS = {
	[TokenType.Minus]: true,
	[TokenType.Not]: true
}

export const SymbolTokens = buildTrie(SYMBOL_TOKENS);
export const KeywordTokens = buildTrie(KEYWORD_TOKENS);