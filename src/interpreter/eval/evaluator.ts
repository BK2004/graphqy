import { Parser, ASTLiteral, ASTNode, ASTNodeType, BinaryOp, UnaryOp, Statement, StatementType, Expression, Var, Assignment, Block, If, While, Repeat, LoopControl, Call } from "../parsing";
import { Error, ErrorType } from "../error";
import { LiteralType, Token, TokenType } from "../scanning";
import { Environment, EnvStateType } from "./environment";
import { Function } from "./dataTypes";
import { Globals } from "./globals";

type Err<T> = Error | T

export class Evaluator {
	parser: Parser;
	environment: Environment;
	flags = {
		break: false,
		continue: false,
	}
	
	constructor(parser: Parser) {
		this.parser = parser;
		const global = new Environment();
		Globals.defineNatives(global);
		this.environment = global;
	}

	// interpret
	// 	Interpret next statement (expression for now)
	// 	@params:
	// 	@returns:
	// 		Error if there is an error parsing or interpreting
	interpret(): Err<undefined> {
		const stmts = this.parser.parse();
		if (stmts instanceof Error) return stmts;
		try {
			stmts.forEach(stmt => this.exec(stmt));
		} catch(e) {
			if (e instanceof Error) {
				// will always be true
				return e;
			}
		}
	}

	// exec
	//	Execute statement AST
	// 	@params:
	// 		root - root of AST
	// 	@returns:
	//		Result of executed AST
	exec(root: Statement): Err<any> {
		if (this.flags.break || this.flags.continue) return;

		switch (root.statementType) {
			case StatementType.Expression:
				return this.eval((root as Expression).expr);
			case StatementType.Var:
				return this.execVar(root as Var);
			case StatementType.Block:
				return this.execBlock(root as Block);
			case StatementType.If:
				return this.execIf(root as If);
			case StatementType.While:
				return this.execWhile(root as While);
			case StatementType.Repeat:
				return this.execDo(root as Repeat);
			case StatementType.LoopControl:
				return this.execLoopControl(root as LoopControl);
		}
	}

	// execVar
	// 	Execute var statement, putting variable data into values map
	// 	@params:
	// 		varStmt - Var node
	// 	@returns:
	execVar(varStmt: Var): Err<void> {
		const val = varStmt.init ? this.eval(varStmt.init) : undefined;
		const res = this.environment.newVar(varStmt.name, varStmt.const, val);
		if (res instanceof Error) this.runtimeError(res, varStmt.line, varStmt.column);
	}

	// execBlock
	// 	Execute block statement
	// 	@params:
	// 		block - Block node
	// 	@returns:
	execBlock(block: Block, invokingState?: EnvStateType): Err<void> {
		// create new environment enclosed by previous
		const prev = this.environment;

		try {
			this.environment = new Environment(prev, invokingState);

			block.statements.forEach(stmt => this.exec(stmt));
		} finally {
			this.environment = prev;
		}
	}

	// execIf
	// 	Execute if statement
	// 	@params:
	// 		node - if node
	// 	@returns:
	execIf(node: If): Err<void> {
		if (this.truthy(this.eval(node.condition))) {
			return this.execBlock(node.thenBlock);
		} else if (node.elseIfBlocks) {
			const evalBlock = node.elseIfBlocks.find(elseIf => this.truthy(this.eval(elseIf.condition)))?.block;
			if (evalBlock !== undefined) {
				return this.execBlock(evalBlock);
			}
		} 
		
		if (node.elseBlock !== undefined) {
			return this.execBlock(node.elseBlock);
		}
	}

	// execWhile
	//	Execute while statement
	// 	@params:
	// 		node - while node
	// 	@returns:
	execWhile(node: While): Err<void> {
		while (!this.flags.break && this.truthy(this.eval(node.condition))) {
			this.execBlock(node.body, EnvStateType.LOOP);
			this.flags.continue = false;
		}

		this.flags.break = false;
	}

	// execDo
	// 	Execute do statement
	// 	@params:
	// 		node - do node
	// 	@returns:
	execDo(node: Repeat): Err<void> {
		do {
			this.execBlock(node.body, EnvStateType.LOOP);
			this.flags.continue = false;
		} while (!this.flags.break && !this.truthy(this.eval(node.condition)));

		this.flags.break = false;
	}

	// execLoopControl
	// 	Execute loop control statement
	// 	@params:
	// 		node - loop control node
	// 	@returns:
	execLoopControl(node: LoopControl): Err<void> {
		if (this.environment.state !== EnvStateType.LOOP) {
			this.runtimeError(new ErrorType.InvalidLoopControl(node.control.tokenType), node.control.line, node.control.column);
		}

		if (node.control.tokenType === TokenType.Break)
			this.flags.break = true;
		else
			this.flags.continue = true;
	}

	// eval
	// 	Evaluate ast
	// 	@params:
	// 		root - root of expression AST to evaluate
	// 	@returns:
	// 		Result of evaluating AST. May be a runtime error.
	eval(root: ASTNode): Err<any> {
		switch(root.nodeType) {
			case ASTNodeType.BinaryOp:
				return this.evalBinaryOp(root as BinaryOp);
			case ASTNodeType.UnaryOp:
				return this.evalUnaryOp(root as UnaryOp);
			case ASTNodeType.Assignment:
				return this.evalAssignment(root as Assignment);
			case ASTNodeType.Literal:
				if ((root as ASTLiteral).literalType === LiteralType.Identifier) {
					const res = this.environment.get((root as ASTLiteral).value as string);
					if (res instanceof Error) this.runtimeError(res, (root as ASTLiteral).line, (root as ASTLiteral).column);
					return res;
				}
				return (root as ASTLiteral).value;
			case ASTNodeType.Call:
				return this.evalCall(root as Call);
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
			default:
				// and/or
				const leftRes = this.eval(left);
				if (node.op.tokenType === TokenType.Or) {
					if (this.truthy(leftRes)) return leftRes;
				} else {
					if (!this.truthy(leftRes)) return leftRes;
				}

				return this.eval(right);
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

	// evalAssignment
	// 	Evaluates assignment
	// 	@params:
	// 		assignment - assignment node
	// 	@returns:
	evalAssignment(assignment: Assignment): Err<void> {
		const res = this.environment.set(((assignment as Assignment).lhs as ASTLiteral).value as string,
			this.eval((assignment as Assignment).rhs));
		if (res instanceof Error)
			this.runtimeError(res, assignment.line, assignment.column);
	}

	// evalCall
	// 	Evaluates call expression
	// 	@params:
	// 		node - call node
	// 	@returns:
	evalCall(node: Call): Err<void> {
		const callee = this.eval(node.callee);

		const args: any[] = [];
		node.args.forEach(a => args.push(this.eval(a)))

		if (!(callee instanceof Function)) {
			this.runtimeError(new ErrorType.NotCallable(), node.line, node.column)
		}

		if ((callee as Function).native) {
			return (callee as Function).nativeFunction!(...args);
		}
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
				this.runtimeError(new ErrorType.UnexpectedType(v === null ? "null" : typeof v, "number"), operator.line, operator.column);
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