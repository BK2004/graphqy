import { Scanner, Token, TokenType, Literal, LiteralType, OPERATOR_PRECEDENCE } from "../scanning";
import { Error, ErrorType } from "../error";
import { ASTLiteral, BinaryOp, ASTNode } from ".";

type Err<T> = Error | T

export class Parser {
	scanner: Scanner;
	currentToken: Token;
	prevToken: Token;
	error?: Error;

	constructor(scanner: Scanner) {
		this.scanner = scanner;
		this.currentToken = new Token(TokenType.EOF, 0, 0);
		this.prevToken = new Token(TokenType.EOF, 0, 0);

		const err = this.scanner.scanTokens();
		if (err) this.error = err;
		else this.currentToken = this.scanner.peek();
	}

	// getError
	// 	Gets error if parser faced an error
	// 	@params:
	// 	@returns:
	// 		Error if parser errored at any point, otherwise undefined
	getError(): Err<undefined> {
		return this.error;
	}

	// next
	// 	Advances to next token in scanner
	// 	@params:
	// 	@returns:
	// 		Current token
	next(): Token {
		this.prevToken = this.currentToken;
		this.currentToken = this.scanner.lookAhead(1);
		return this.scanner.advance();
	}

	// match
	//	Checks for match between current token and given token types. If there is a match, current token is consumed, otherwise nothing happens
	// 	@params:
	// 		types - Types of tokens to match
	// 	@returns:
	// 		Whether there was a match
	match(...types: TokenType[]): boolean {
		if (types.includes(this.currentToken.tokenType)) {
			this.next();
			return true;
		}
		return false;
	}

	// previous
	//	Gets previous token
	// 	@params:
	// 	@returns:
	// 		Previous token, or EOF if there is none
	previous(): Token {
		return this.prevToken;
	}

	// parseExpression
	// 	Parses expression
	// 	@params:
	// 		prev - Previous operator precedence
	parseExpression(prev: number): Err<ASTNode> {
		let left = this.parseTerminalNode();
		if (left instanceof Error) return left;
		
		let right: Err<ASTNode>;
		let token: Token = this.currentToken;
		if (!this.getPrecedence(token)) return left;

		let exprFlags = [TokenType.EOF, TokenType.Semicolon]

		while (this.getPrecedence(token) && this.getPrecedence(token)! > prev) {
			this.next();
			right = this.parseExpression(this.getPrecedence(token)!);
			if (right instanceof Error) return right;

			// Join left and right with binary op
			left = new BinaryOp(token.tokenType, left, right as ASTNode)

			token = this.currentToken;
			if (!this.getPrecedence(token)) return left;
		}

		return left;
	}

	// parseTerminalNode
	// 	Parses terminal node, i.e., a node with a direct value
	// 	@params:
	// 	@returns:
	// 		Terminal node if it is current token, otherwise error
	parseTerminalNode(): Err<ASTNode> {
		if (!this.match(TokenType.Literal))
			return this.wrapError(new ErrorType.UnexpectedToken(this.currentToken.tokenType, [TokenType.Literal]));
		
		// current token is a literal, treat it as such
		return new ASTLiteral((this.previous() as Literal).literalType, this.next().value!)
	}

	// getPrecedence
	// 	Gets precedence of operator token
	// 	@params:
	// 		token - Token to get precedence of
	// 	@returns:
	// 		precedence of token or undefined if it isn't an operator
	getPrecedence(token: Token): number | undefined {
		if (token.tokenType in OPERATOR_PRECEDENCE) {
			return OPERATOR_PRECEDENCE[token.tokenType];
		}
	}

	// wrapError
	// 	Wraps errorType with current token info
	// 	@params:
	// 		errorType - Type of error that occurred
	// 	@returns:
	// 		Wrapped error
	wrapError(errorType: Error): Error {
		errorType.columnNumber = this.currentToken.column;
		errorType.lineNumber = this.currentToken.line;

		return errorType;
	}
}