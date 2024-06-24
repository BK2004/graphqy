import { TokenType } from "./tokens";

type char = string;

export class Error {
	msg: string;
	lineNumber?: number;
	errorCode: string;
	columnNumber?: number;

	constructor(errorCode: string, msg: string) {
		this.msg = msg;
		this.errorCode = errorCode;
	}

	// fmtString
	// 	Formats error message for display
	//	@params:
	// 	@returns:
	// 		Formatted error string
	fmtString(): string {
		return `${this.errorCode}: ${this.msg} (${this.lineNumber || 0}:${this.columnNumber || 0})`;
	}
}

export const ErrorType = {
	InvalidCharacter: class extends Error {
		constructor(received: char) {
			super("INVALID_CHAR", `Received '${received}'`)
		}
	},
	InvalidToken: class extends Error {
		constructor(received: TokenType) {
			super("INVALID_TOKEN", `Received '${received}'`)
		}
	},
	UnknownSymbol: class extends Error {
		constructor(received: string) {
			super("UNKNOWN_SYMBOL", `Received '${received}'`)
		}
	}
}