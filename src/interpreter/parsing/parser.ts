import { Scanner, Token, TokenType, Literal, LiteralType, OPERATOR_PRECEDENCE, RL_ASSOCIATIVE_TOKENS, UNARY_TOKENS } from "../scanning";
import { Error, ErrorType } from "../error";
import { ASTLiteral, BinaryOp, ASTNode, UnaryOp, Statement, Print, Expression, Var, Assignment, Block, If, While, Repeat } from ".";

type Err<T> = T

export class Parser {
	scanner: Scanner;
	currentToken: Token;
	prevToken: Token;

	constructor(scanner: Scanner) {
		this.scanner = scanner;
		this.currentToken = new Token(TokenType.EOF, 0, 0);
		this.prevToken = new Token(TokenType.EOF, 0, 0);

		const err = this.scanner.scanTokens();
		if (err) throw err;
		else this.currentToken = this.scanner.peek();
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

	// test
	// 	Tests for match between current token and token types. Nothing is consumed
	test(...types: TokenType[]): boolean {
		return types.includes(this.currentToken.tokenType);
	}

	// consume
	// 	Consume next token, and error if it isn't tokenType
	//	@params:
	// 		tokenType - expected token type
	// 	@returns:
	consume(tokenType: TokenType): Err<void> {
		if (this.next().tokenType !== tokenType) {
			throw this.wrapError(new ErrorType.TokenExpected(tokenType));
		}
	}

	// previous
	//	Gets previous token
	// 	@params:
	// 	@returns:
	// 		Previous token, or EOF if there is none
	previous(): Token {
		return this.prevToken;
	}

	// synchronize
	// 	Synchronize parser after error
	// 	@params:
	// 	@returns:
	synchronize() {
		this.next();

		while (this.currentToken.tokenType !== TokenType.EOF) {
			if (this.previous().tokenType == TokenType.Semicolon) return;

			switch (this.currentToken.tokenType) {
				case TokenType.Var:
				case TokenType.Const:
				case TokenType.Print:
				case TokenType.While:
				case TokenType.Repeat:
					return;
			}

			this.next();
		}
	}

	// parse
	//	Parses all statements in program
	// 	@params:
	// 	@returns:
	// 		List of statements
	parse(): Err<Statement[]> {
		const res: Statement[] = [];

		while (this.currentToken.tokenType !== TokenType.EOF) {
			const next = this.parseDeclaration();
			if (next) res.push(next);
		}

		return res;
	}

	// parseDeclaration
	// 	Parses declaration statement (e.g. class or const)
	// 	@params:
	// 	@returns:
	// 		Parsed declaration statement or regular statement
	parseDeclaration(): Statement | void {
		try {
			if (this.match(TokenType.Var, TokenType.Const)) {
				return this.parseVarDeclaration();
			}

			return this.parseStatement();
		} catch (e: any) {
			console.log((e as Error).fmtString())
			this.synchronize();
		}
	}

	// parseVarDeclaration
	// 	Parses variable declaration (const and var)
	// 	@params:
	// 	@returns:
	// 		Var declaration node
	parseVarDeclaration(): Err<Var> {
		const isConst = this.previous().tokenType == TokenType.Const;

		if (!this.match(TokenType.Literal)) 
			throw this.wrapError(new ErrorType.UnexpectedToken(this.currentToken.tokenType, ["identifier"]));
		if ((this.previous() as Literal).literalType !== LiteralType.Identifier) 
			throw this.wrapError(new ErrorType.UnexpectedType((this.previous() as Literal).literalType.toString(), "identifier"));
		const name = this.previous() as Literal;

		let init;
		// if an equal sign follows, the var is initialized
		if (this.match(TokenType.Equals)) {
			init = this.parseEquality(0);
		}

		this.match(TokenType.Semicolon);
		return new Var(name, isConst, init);
	}

	// parseStatement
	//	Parses next statement in program
	// 	@params:
	// 	@returns:
	// 		Next statement or error if there is an error
	parseStatement(): Err<Statement> {
		if (this.match(TokenType.Print)) return this.parsePrint();
		if (this.match(TokenType.Block)) return this.parseBlock(TokenType.End);
		if (this.match(TokenType.If)) return this.parseIf();
		if (this.match(TokenType.While)) return this.parseWhile();
		if (this.match(TokenType.Repeat)) return this.parseRepeat();

		const expr = this.parseExpression();
		this.match(TokenType.Semicolon);
		return new Expression(expr);
	}

	// parseBlock
	//	Parses block of statements
	// 	@params:
	// 		flags - token types that mark end of block
	// 	@returns:
	// 		Parsed block
	parseBlock(...flags: TokenType[]): Err<Block> {
		const block = new Block();

		while (!this.test(...flags) && this.currentToken.tokenType !== TokenType.EOF) {
			const stmt = this.parseDeclaration();
			if (stmt) block.statements.push(stmt);
		}

		if (!this.match(...flags)) {
			throw this.wrapError(new ErrorType.TokenExpected(...flags));
		}

		return block;
	}

	// parseIf
	// 	Parses if statement
	// 	@params:
	// 	@returns:
	// 		Parsed if statement
	parseIf(): Err<If> {
		const condition = this.parseOr();
		this.consume(TokenType.Then);

		const thenBlock = this.parseBlock(TokenType.End, TokenType.Else, TokenType.ElseIf);

		// scan else if blocks while they appear
		const elseIfBlocks = [];
		while (this.previous().tokenType === TokenType.ElseIf) {
			const condition = this.parseEquality(0);
			if (!this.match(TokenType.Then)) {
				throw this.wrapError(new ErrorType.TokenExpected(TokenType.Then));
			}

			const elseIfBlock = this.parseBlock(TokenType.End, TokenType.Else, TokenType.ElseIf);
			elseIfBlocks.push({ condition, block: elseIfBlock });
		}

		return new If(condition, thenBlock, elseIfBlocks,
			this.previous().tokenType === TokenType.Else ? this.parseBlock(TokenType.End) : undefined);
	}

	// parsePrint
	// 	Parses print statement
	// 	@params:
	// 	@returns:
	// 		Print statement node
	parsePrint(): Err<Print> {
		const expr = this.parseEquality(0);
		return new Print(expr);
	}

	// parseWhile
	// 	Parses while loop
	// 	@params:
	// 	@returns:
	// 		While statement
	parseWhile(): Err<While> {
		const condition = this.parseOr();
		this.consume(TokenType.Do);

		const body = this.parseBlock(TokenType.End);

		return new While(condition, body);
	}

	// parseRepeat
	// 	Parses repeat ... until loop
	// 	@params:
	// 	@returns:
	// 		do statement
	parseRepeat(): Err<Repeat> {
		const body = this.parseBlock(TokenType.Until);
		const condition = this.parseOr();

		this.match(TokenType.Semicolon);
		return new Repeat(body, condition);
	}

	// parseExpression
	// 	Parses expression
	// 	@params:
	// 	@returns:
	// 		Expression
	parseExpression(): Err<ASTNode> {
		return this.parseAssignment();
	}

	// parseAssignment
	// 	Parses assignment
	// 	@params:
	// 	@returns:
	// 		Assignment or equality
	parseAssignment(): Err<ASTNode> {
		const left = this.parseOr();

		if (this.match(TokenType.Equals)) {
			// This is an assignment expression, treat it as such
			const eq = this.previous();
			const value = this.parseEquality(0);

			if (left instanceof ASTLiteral && (left as ASTLiteral).literalType === LiteralType.Identifier) {
				// variable
				return new Assignment(left, value, eq.line, eq.column);
			}

			// Invalid l-value
			throw this.wrapError(new ErrorType.BadAssignmentTarget());
		}

		return left;
	}

	// parseOr
	// 	Parses or statements
	// 	@params:
	// 	@returns:
	// 		Or expressiosn
	parseOr(): Err<ASTNode> {
		let expr = this.parseAnd();

		while (this.match(TokenType.Or)) {
			const op = this.previous();
			const right = this.parseAnd();
			expr = new BinaryOp(op, expr, right);
		}

		return expr;
	}

	// parseAnd
	// 	Parses and statements
	// 	@params:
	// 	@returns:
	// 		And expressions
	parseAnd(): Err<ASTNode> {
		let expr = this.parseEquality(0);

		while (this.match(TokenType.And)) {
			const op = this.previous();
			const right = this.parseEquality(0);
			expr = new BinaryOp(op, expr, right);
		}

		return expr;
	}

	// parseEquality
	// 	Parses equality
	// 	@params:
	// 		prev - Previous operator precedence
	// 	@returns:
	// 		Equality
	parseEquality(prev: number): Err<ASTNode> {
		let left = this.parseTerminalNode();
		
		let right: ASTNode;
		let token: Token = this.currentToken;
		if (!this.getPrecedence(token)) return left;

		while (this.getPrecedence(token) && ((this.getPrecedence(token)! > prev) || (this.getPrecedence(token)! === prev && this.isRLAssociative(token)))) {
			this.next();
			right = this.parseEquality(this.getPrecedence(token)!);

			// Join left and right with binary op
			left = new BinaryOp(token, left, right as ASTNode)
			
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
		if (this.match(TokenType.Literal, TokenType.LeftParen, TokenType.True, TokenType.False)) {
			switch (this.previous().tokenType) {
				case TokenType.LeftParen:
					const res = this.parseEquality(0);
	
					// If expression isn't ended by a right paren, error
					if (!this.match(TokenType.RightParen))
						throw this.wrapError(new ErrorType.UnexpectedToken(this.currentToken.tokenType, [TokenType.RightParen]));
	
					return res;
				case TokenType.True:
					return new ASTLiteral(LiteralType.Boolean, true, this.previous().line, this.previous().column);
				case TokenType.False:
					return new ASTLiteral(LiteralType.Boolean, false, this.previous().line, this.previous().column);
				default:
					// current token is a literal, treat it as such
					return new ASTLiteral((this.previous() as Literal).literalType, this.previous().value!, this.previous().line, this.previous().column)
			}
		}
		// If a unary operator, parse terminal node to the right
		else if (this.currentToken.tokenType in UNARY_TOKENS) {
			const token = this.next();
			const res = this.parseTerminalNode();
			
			return new UnaryOp(token, res);
		}
		else {
			throw this.wrapError(new ErrorType.ExpectedTerminal(this.currentToken.tokenType));
		}
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

	// isRLAssociative
	// 	Gets whether a token is right-to-left associative
	// 	@params:
	// 		token - Token to check
	// 	@returns:
	// 		Whether token is RL associative
	isRLAssociative(token: Token): boolean {
		return token.tokenType in RL_ASSOCIATIVE_TOKENS;
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