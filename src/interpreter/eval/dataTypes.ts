import { Statement } from "../parsing";

export class Function {
	statements: Statement[];
	native?: boolean;
	nativeFunction?: (...args: any[]) => any;

	constructor(statements: Statement[], native?: boolean, nativeFunction?: (...args: any[]) => any) {
		this.statements = statements;
		this.native = native;
		this.nativeFunction = nativeFunction;
	}
}