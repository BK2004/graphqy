import { ASTLiteral } from "./parsing";
import { TokenType } from "./scanning";

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
	},
	UnexpectedToken: class extends Error {
		constructor(received: TokenType, expected: string[]) {
			super("UNEXP_TOKEN", `Received '${received}' but expected ${expected.length > 1 ? `one of: ${expected.join(", ")}` : expected.join("")}`)
		}
	},
	TokenExpected: class extends Error {
		constructor(expected: TokenType) {
			super("TOKEN_EXP", `Expected ${expected}`)
		}
	},
	ExpectedTerminal: class extends Error {
		constructor(received: TokenType) {
			super("EXP_TERM", `Received '${received}' but expected a terminal value`)
		}
	},
	UnknownEscape: class extends Error {
		constructor(received: char) {
			super("UNKKNOWN_ESCAPE", `Unknown escape sequence '\\${received}'`)
		}
	},
	UnexpectedType: class extends Error {
		constructor(received: string, expected: string) {
			super("UNEXP_TYPE", `Received a ${received} but expected ${expected}`)
		}
	},
	DivideByZero: class extends Error {
		constructor() {
			super("DIV_BY_ZERO", `Attempted to divide by zero`)
		}
	},
	BadComparison: class extends Error {
		constructor(leftType: string, rightType: string) {
			super("BAD_CMP", `Can't compare ${leftType} and ${rightType}`)
		}
	},
	VarExists: class extends Error {
		constructor(name: string) {
			super("VAR_EXISTS", `Variable ${name} already exists`)
		}
	},
	VarDNE: class extends Error {
		constructor(name: string) {
			super("VAR_DNE", `Variable ${name} does not exist`)
		}
	},
	BadAssignmentTarget: class extends Error {
		constructor() {
			super("BAD_ASSG_TRG", `Can't assign to target`)
		}
	},
	ConstVar: class extends Error {
		constructor(name: string) {
			super("CONST_VAR", `Variable ${name} is constant and can't be reassigned`)
		}
	}
}