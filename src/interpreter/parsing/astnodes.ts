import { LiteralType, Token, TokenType } from "../scanning";

export enum ASTNodeType {
	Literal,
	BinaryOp,
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

	constructor(literalType: LiteralType, value: string | number | boolean) {
		super(ASTNodeType.Literal);

		this.literalType = literalType;
		this.value = value;
	}
}

export class BinaryOp extends ASTNode {
	children: [ASTNode, ASTNode];
	op: TokenType;

	constructor(op: TokenType, lchild: ASTNode, rchild: ASTNode) {
		super(ASTNodeType.BinaryOp);

		this.children = [lchild, rchild];
		this.op = op;
	}
}