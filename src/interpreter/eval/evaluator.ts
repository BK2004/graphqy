import { Parser, ASTLiteral, ASTNode, ASTNodeType, BinaryOp, UnaryOp, printAST } from "../parsing";
import { Error, ErrorType } from "../error";
import { Token, TokenType } from "../scanning";

type Err<T> = Error | T

export class Evaluator {
	parser: Parser;

	constructor(parser: Parser) {
		this.parser = parser;
	}

	// interpret
	// 	Interpret next statement (expression for now)
	// 	@params:
	// 	@returns:
	// 		Error if there is an error parsing or interpreting
	interpret(): Err<undefined> {
		const ast = this.parser.parseExpression(0);

		if (ast instanceof Error) {
			return ast;
		}

		try {
			return this.eval(ast);
		} catch(e) {
			if (e instanceof Error) {
				// will always be true
				return e;
			}
		}
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
	evalBinaryOp(node: BinaryOp): number|string|boolean {
		const left = this.eval(node.children[0]);
		const right = this.eval(node.children[1]);

		switch (node.op.tokenType) {
			case TokenType.Asterisk2:
				this.ensureArithmeticOperands(node.op, left, right);
				return left ** right;
			case TokenType.Asterisk:
				this.ensureArithmeticOperands(node.op, left, right);
				return left * right;
			case TokenType.Slash:
				this.ensureArithmeticOperands(node.op, left, right);
				if (right == 0) {
					this.runtimeError(new ErrorType.DivideByZero(), node.op.line, node.op.column);
				}
				return left / right;
			case TokenType.Plus:
				if (typeof left === "string" || typeof right === "string")
					return left.toString() + right.toString();
				this.ensureArithmeticOperands(node.op, left, right);
				return left + right;
			case TokenType.Minus:
				this.ensureArithmeticOperands(node.op, left, right);
				return left - right;
			case TokenType.Equals2:
				return left === right;
			case TokenType.LessThan:
				this.ensureComparableOperands(node.op, left, right);
				return left < right;
			case TokenType.LessThanEquals:
				this.ensureComparableOperands(node.op, left, right);
				return left <= right;
			case TokenType.GreaterThan:
				this.ensureComparableOperands(node.op, left, right);
				return left > right;
			case TokenType.GreaterThanEquals:
				this.ensureComparableOperands(node.op, left, right);
				return left >= right
			case TokenType.NotEquals:
				return left !== right;
			case TokenType.And:
				return this.truthy(left) && this.truthy(right);
			case TokenType.Or:
				return this.truthy(left) || this.truthy(right);
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
		switch (node.op.tokenType) {
			case TokenType.Minus:
				this.ensureArithmeticOperands(node.op, ch);
				return -ch;
			case TokenType.Not:
				return !this.truthy(ch);
		}

		return 0; // never runs
	}

	// ensureArithmeticOperands
	// 	Verifies that values are numeric operands
	// 	@params:
	// 		operator - token which would signify error location
	// 		values - list of values to check
	// 	@returns:
	// 		arithmetic operands if applicable
	ensureArithmeticOperands(operator: Token, ...values: any[]): number[] {
		const res: number[] = [];
		values.forEach(v => {
			if (typeof v === "number")
				res.push(v);
			else {
				this.runtimeError(new ErrorType.UnexpectedType(typeof v, "number"), operator.line, operator.column);
			}
		})

		return res;
	}

	// ensureComparableOperands
	// 	Verifies that values are comparable, i.e., can be compared with <, <=, etc.
	// 	@params:
	// 		operator - token which would signify error location
	// 		left - left value
	// 		right - right value
	// 	@returns:
	// 		comparable values if applicable
	ensureComparableOperands(operator: Token, left: any, right: any): any[2] {
		const comparable = ["string", "number"];
		if (typeof left !== typeof right || !comparable.find(v => v === typeof left)) {
			this.runtimeError(new ErrorType.BadComparison(typeof left, typeof right), operator.line, operator.column);
		}

		return [left, right];
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
	// 		line - line where error occurred
	// 		column - column where error occurred
	// 	@returns:
	runtimeError(error: Error, line?: number, column?: number) {
		error.lineNumber = line;
		error.columnNumber = column;
		throw error;
	}
}