import { Parser, ASTLiteral, ASTNode, ASTNodeType, BinaryOp } from "../parsing";
import { Error } from "../error";
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
	evalBinaryOp(node: BinaryOp): number {
		const left = this.eval(node.children[0]);
		const right = this.eval(node.children[1]);

		switch (node.op) {
			case TokenType.Asterisk:
				return left * right;
			case TokenType.Slash:
				return left / right;
			case TokenType.Minus:
				return left - right;
			case TokenType.Plus:
				return left + right;
			case TokenType.Asterisk2:
				return left ** right;
		}

		return 0; // never runs, this is for type purposes
	}
}