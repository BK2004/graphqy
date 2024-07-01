import { Token, Literal, TokenType, LiteralType, SymbolTokens, KeywordTokens } from ".";
import { Error, ErrorType } from "../error";

type char = string
type Err<T> = Error | T

export class Scanner {
	code: string;
	putBacks: string[] = [];
	curr: number = 0;
	lineCount: number = 1;
	currentColumn: number = 0;
	tokens?: Token[];

	constructor(code: string) {
		this.code = code;
	}

	// scanTokens
	// 	Scans all tokens in code
	// 	@params:
	// 	@returns:
	// 		Error if there is a scanning error
	scanTokens(): Error|undefined {
		if (this.tokens) {
			return;
		}

		this.tokens = [];

		let curr: Err<Token | undefined>;
		while (!curr || (curr as Token).tokenType !== TokenType.EOF) {
			curr = this.scanNext();
			if (curr instanceof Error) return curr;
			this.tokens.push(curr);
		}

		// Reverse so first token is at back of array for O(1) removal
		for (let i = 0; i < this.tokens.length/2; i++) {
			const temp = this.tokens[this.tokens.length - i - 1];
			this.tokens[this.tokens.length - i - 1] = this.tokens[i];
			this.tokens[i] = temp;
		}
	}

	// peek
	// 	Peek at current token in tokens
	//	Requires scanTokens()
	// 	@params:
	// 	@returns:
	// 		Current token in tokens or EOF if no more tokens/tokens not scanned
	peek(): Token {
		return this.lookAhead(0);
	}

	// advance
	// 	Advances one token forward
	// 	Requires scanTokens()
	// 	@params:
	// 	@returns:
	// 		Discarded token or EOF if no token to advance past/tokens not scanned
	advance(): Token {
		if (!this.tokens) {
			return new Token(TokenType.EOF, this.lineCount, this.currentColumn);
		}

		return this.tokens!.pop() 
			|| new Token(TokenType.EOF, this.lineCount, this.currentColumn);
	}

	// lookAhead
	// 	Checks token 'n' ahead of current
	// 	Requires scanTokens()
	// 	@params:
	// 		n - # ahead to look
	// 	@returns:
	// 		token 'n' ahead or EOF if it doesn't exist/tokens not scanned
	lookAhead(n: number): Token {
		if (!this.tokens) return new Token(TokenType.EOF, this.lineCount, this.currentColumn);

		n = this.tokens!.length - n - 1;
		if (n < 0) return new Token(TokenType.EOF, this.lineCount, this.currentColumn);
		return this.tokens![n];
	}

	// putBack
	// 	Puts character in put backs
	// 	@params:
	// 		c - character to put back
	// 	@returns:
	putBack(c: char) {
		this.putBacks.push(c);
	}

	// wrapError
	// 	Wraps specific error with scanner details, i.e., line number, column number, etc.
	// 	@params:
	// 		error - specific error to be wrapped
	// 	@returns:
	// 		error
	wrapError(error: Error) {
		error.lineNumber = this.lineCount;
		error.columnNumber = this.currentColumn;

		return error;
	}

	// nextChar
	//  Scans next character in code, including whitespace, special characters, etc.
	// 	@params:
	// 	@returns:
	// 		Next character in code if it exists, otherwise 'EOF'
	nextChar(): char {
		// If put backs not empty, return char on top of stack
		if (this.putBacks.length !== 0) {
			return this.putBacks.pop()!;
		}

		if (this.curr >= this.code.length) {
			return "EOF";
		} else {
			const c = this.code[this.curr++];
			this.currentColumn++;
			if (c === '\n') {
				this.lineCount++;
				this.currentColumn = 0;
			}
			return c;
		}
	}

	// skipWhitespace
	// 	Skips whitespace from curr until EOF or next non-whitespace character
	// 	@params:
	// 	@returns:
	skipWhitespace() {
		let c;
		while (c = this.nextChar()) {
			if (c === 'EOF') break;
			if (!c.match(/\s/)) {
				this.putBack(c);
				break;
			}
		}
	}

	// scanNext
	//  Scans the next token in code, returning that token or 'EOF.' Skips whitespace at the beginning. May return error.
	// 	@params:
	// 	@returns:
	// 		Next token in code, or 'EOF' if no more characters. Might error.
	scanNext(): Err<Token> {
		// Skip whitespace before scanning a token
		this.skipWhitespace();

		const next = this.nextChar();
		if (next === 'EOF') return new Token(TokenType.EOF, this.lineCount, this.currentColumn);

		// If starts with number, scan a number literal
		if (next.match(/[0-9]/)) {
			return this.scanNumberLiteral(next);
		}

		// If starts with an alphabetic char, it is either a keyword token or an identifier
		if (next.match(/[a-zA-Z]/)) {
			return this.scanKeywordOrIdentifier(next);
		}

		// If starts with a double quote or a single quote, scan a string
		if (next.match(/['"]/)) {
			return this.scanString(next);
		}

		// If starts with a symbol (e.g., +/-), scan a symbol token
		if (SymbolTokens.children.has(next)) {
			return this.scanSymbolToken(next);
		}

		return this.wrapError(new ErrorType.UnknownSymbol(next));
	}

	// scanNumberLiteral
	// 	Scans number literal, supporting decimal numbers
	// 	@params:
	// 		c - first character in number
	// 	@returns:
	// 		Scanned literal number or error, if needed
	scanNumberLiteral(c: char): Err<Literal> {
		let res: number = 0;
		let decimal = -1;
		let i = 0;
		while (c.match(/[0-9.]/)) {
			if (c === '.') {
				if (decimal > -1) return this.wrapError(new ErrorType.InvalidCharacter('.'));
				else {
					decimal = i;
				}
			} else {
				res = res * 10 + parseInt(c);
			}
			
			c = this.nextChar();
			i++;
		}
		this.putBack(c);

		// If a decimal was found, convert res to floating point
		if (decimal > -1) {
			res = res / Math.pow(10, i - decimal - 1);
		}

		return new Literal(LiteralType.Number, this.lineCount, this.currentColumn, res);
	}

	// scanSymbolToken
	// 	Scans symbol token, e.g., ++
	// 	@params:
	// 		c - first character in token
	// 	@returns:
	// 		Scanned symbol token
	scanSymbolToken(c: char): Err<Token> {
		let curr = SymbolTokens.children.get(c);
		let seen = c;
		if (!curr) return this.wrapError(new ErrorType.UnknownSymbol(seen));

		let lastValue: TokenType|undefined;
		if (curr.value) lastValue = curr.value;

		while (true) {
			c = this.nextChar();

			if (!curr.children.has(c)) {
				this.putBack(c);

				if (!lastValue) {
					return this.wrapError(new ErrorType.UnknownSymbol(seen))
				}
				
				return new Token(lastValue, this.lineCount, this.currentColumn);
			} else {
				seen += c;
				curr = curr?.children.get(c)!;
				if (curr.value) lastValue = curr.value!;
			}
		}
	}

	// scanKeywordOrIdentifier
	// 	Scans a keyword token or an identifier
	// 	@params:
	// 		c - first character in token
	// 	@returns:
	// 		keyword if it matches to one, else an identifier
	scanKeywordOrIdentifier(c: char): Token {
		let res: string = c;

		c = this.nextChar();
		while (c.match(/[a-zA-Z0-9_]/) && c !== "EOF") {
			res += c;
			c = this.nextChar();
		}
		
		if (c !== "EOF")
			this.putBack(c);
		
		let curr = KeywordTokens;
		for (let i = 0; i < res.length; i++) {
			if (!curr.children.has(res[i])) {
				return new Literal(LiteralType.Identifier, this.lineCount, this.currentColumn, res);
			} else {
				curr = curr.children.get(res[i])!;
			}
		}

		// If it escapes loop and curr has a value, it is a keyword token
		if (curr.value) {
			return new Token(curr.value!, this.lineCount, this.currentColumn);
		} else {
			return new Literal(LiteralType.Identifier, this.lineCount, this.currentColumn, res);
		}
	}

	// scanString
	// 	Scans string, consuming characters until it comes across close
	// 	@params:
	// 		close - what to end string with (' or ")
	// 	@returns:
	// 		scanned string, or error
	scanString(close: char): Err<Token> {
		let res = "";
		let c: char = this.nextChar();

		while (c !== close && c !== "EOF") {
			// If c is start of escape sequence, scan it
			if (c === "\\") {
				c = this.nextChar()
				switch (c) {
					case '\\':
						res += "\\";
						break;
					case 'n':
						res += "\n";
						break;
					case 't':
						res += "\t";
						break;
					case '\'':
						res += "\'";
						break;
					case '"':
						res += "\"";
						break;
					case '\n':
						// allow multiline strings
						break;
					case ' ':
						break;
					default:
						return this.wrapError(new ErrorType.UnknownEscape(c));
				}
			} else {
				res += c;
			}

			c = this.nextChar();
		}

		if (c === "EOF") {
			return this.wrapError(new ErrorType.UnexpectedToken(TokenType.EOF, [close]))
		}

		return new Literal(LiteralType.String, this.lineCount, this.currentColumn, res);
	}
}