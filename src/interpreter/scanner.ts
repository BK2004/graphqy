import { Token, Literal, TokenType, LiteralType } from "./tokens";
import { Error, ErrorType } from "./error";
import { symbolTokens } from './tokens';

type char = string

class Scanner {
	code: string;
	putBacks: string[] = [];
	curr: number = 0;
	lineCount: number = 1;
	currentColumn: number = 0;

	constructor(code: string) {
		this.code = code;

		console.log(symbolTokens);
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
	scanNext(): Token|Error {
		// Skip whitespace before scanning a token
		this.skipWhitespace();

		const next = this.nextChar();
		if (next === 'EOF') return new Token(TokenType.EOF);

		// If starts with number, scan a number literal
		if (next.match(/[0-9]/)) {
			return this.scanNumberLiteral(next);
		}

		// If starts with a symbol (e.g., +/-), scan a symbol token
		if (symbolTokens.children.has(next)) {
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
	scanNumberLiteral(c: char): Literal|Error {
		let res: number = 0;
		let decimal = -1;
		let i = 0;
		while (c.match(/[0-9.]/)) {
			if (c === '.') {
				if (decimal > -1) return this.wrapError(new ErrorType.InvalidCharacter('.')); // TODO: Throw error for invalid character
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

		return new Literal(LiteralType.Number, res);
	}

	// scanSymbolToken
	// 	Scans symbol token, e.g., ++
	// 	@params:
	// 		c - first character in token
	// 	@returns:
	// 		Scanned symbol token
	scanSymbolToken(c: char): Token|Error {
		let curr = symbolTokens.children.get(c);
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
				return new Token(lastValue!);
			} else {
				seen += c;
				curr = curr?.children.get(c)!;
				if (curr.value) lastValue = curr.value!;
			}
		}
	}
}

export default Scanner;