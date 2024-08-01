import { LiteralType, Token, TokenType } from "../scanning";

export enum ASTNodeType {
	Literal,
	BinaryOp,
	UnaryOp,
	Assignment,
	Call,
}

export class ASTNode {
	nodeType: ASTNodeType;

	constructor(nodeType: ASTNodeType) {
		this.nodeType = nodeType;
	}
}

export class ASTLiteral extends ASTNode {
	literalType: LiteralType;
	value: string | number | boolean;
	line?: number;
	column?: number;

	constructor(literalType: LiteralType, value: string | number | boolean, line?: number, column?: number) {
		super(ASTNodeType.Literal);

		this.literalType = literalType;
		this.value = value;
		this.line = line;
		this.column = column;
	}
}

export class BinaryOp extends ASTNode {
	children: [ASTNode, ASTNode];
	op: Token;

	constructor(op: Token, lchild: ASTNode, rchild: ASTNode) {
		super(ASTNodeType.BinaryOp);

		this.children = [lchild, rchild];
		this.op = op;
	}
}

export class UnaryOp extends ASTNode {
	child: ASTNode;
	op: Token;

	constructor(op: Token, child: ASTNode) {
		super(ASTNodeType.UnaryOp);

		this.child = child;
		this.op = op;
	}
}

export class Assignment extends ASTNode {
	lhs: ASTNode;
	rhs: ASTNode;
	line: number;
	column: number;

	constructor(lhs: ASTNode, rhs: ASTNode, line: number, column: number) {
		super(ASTNodeType.Assignment);
		this.lhs = lhs;
		this.rhs = rhs;
		this.line = line;
		this.column = column;
	}
}

export class Call extends ASTNode {
	callee: ASTNode;
	args: ASTNode[];
	line?: number;
	column?: number;

	constructor(callee: ASTNode, args: ASTNode[], line?: number, column?: number) {
		super(ASTNodeType.Call);

		this.callee = callee;
		this.args = args;
		this.line = line;
		this.column = column;
	}
}