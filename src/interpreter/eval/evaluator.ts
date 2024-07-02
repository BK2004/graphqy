import { Parser, ASTLiteral, ASTNode, ASTNodeType, BinaryOp, UnaryOp } from "../parsing";
import { Error, ErrorType } from "../error";
import { Token, TokenType } from "../scanning";

type Err<T> = Error | T

export class Evaluator {
	parser: Parser;

	constructor(parser: Parser) {
		this.parser = parser;
	}

	// next
	// 	Evaluate next statement (expression for now)
	// 	@params:
	// 	@returns:
	// 		Error if there is an error parsing
	next(): Err<undefined> {
		const ast = this.parser.parseExpression(0);

		if (ast instanceof Error) return ast;

		const res = this.eval(ast);
		return res;
	}

	// eval
	// 	Evaluate ast
	// 	@params
	// 		root - root of AST to evaluate
	// 	@returns
	// 		Result of evaluating AST. May be a runtime error.
	eval(root: ASTNode): Err<any> {
		switch(root.nodeType) {
			case ASTNodeType.BinaryOp:
				return this.evalBinaryOp(root as BinaryOp);
			case ASTNodeType.UnaryOp:
				return this.evalUnaryOp(root as UnaryOp);
			case ASTNodeType.Literal:
				return (root as ASTLiteral).value;
		}
	}

	// evalBinaryOp
	// 	Evaluates binary op node
	// 	@params:
	// 		node - node to evaluate
	// 	@returns:
	// 		Value evaluated
	evalBinaryOp(node: BinaryOp): number|string {
		const left = this.eval(node.children[0]);
		const right = this.eval(node.children[1]);

		switch (node.op) {
			case TokenType.Asterisk:
				this.ensureArithmeticOperands(left, right);
				return left * right;
			case TokenType.Slash:
				this.ensureArithmeticOperands(left, right);
				return left / right;
			case TokenType.Minus:
				this.ensureArithmeticOperands(left, right);
				return left - right;
			case TokenType.Plus:
				if (typeof left === "string" || typeof right === "string")
					return left.toString() + right.toString();
				this.ensureArithmeticOperands(left, right);
				return left + right;
			case TokenType.Asterisk2:
				this.ensureArithmeticOperands(left, right);
				return left ** right;
		}

		return 0; // never runs
	}

	// evalUnaryOp
	// 	Evaluates unary op node
	// 	@params:
	// 		node - node to evaluate
	// 	@returns:
	// 		value evaluated
	evalUnaryOp(node: UnaryOp): number|boolean {
		const ch = this.eval(node.child);
		switch (node.op) {
			case TokenType.Minus:
				this.ensureArithmeticOperands(ch);
				return -ch;
			case TokenType.Bang:
				return !this.truthy(ch);
		}

		return 0; // never runs
	}

	// ensureArithmeticOperands
	// 	Verifies that values are numeric operands
	// 	@params:
	// 		values - list of values to check
	// 	@returns:
	// 		arithmetic operands if applicable
	ensureArithmeticOperands(...values: any[]): number[] {
		const res: number[] = [];
		values.forEach(v => {
			if (typeof v === "number")
				res.push(v);
			else {
				this.runtimeError(new ErrorType.UnexpectedType(typeof v, "number"));
			}
		})

		return res;
	}

	// truthy
	// 	Determine whether value is 'truthy', i.e., either true or not nil
	// 	@params:
	// 		value - value to check for truthiness
	// 	@returns:
	// 		whether value is truthy
	truthy(value: any): boolean {
		if (value === false || value === undefined) return false;
		return true;
	}

	// runtimeError
	// 	Throw a run time error with given error type
	// 	@params:
	// 		error - error to wrap
	// 	@returns:
	runtimeError(error: Error) {
		throw new Error(error.errorCode, error.fmtString());
	}
}