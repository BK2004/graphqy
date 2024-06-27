import { BinaryOpType, LiteralType, Token } from "../scanning";

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
	value: string | number;

	constructor(literalType: LiteralType, value: string | number) {
		super(ASTNodeType.Literal);

		this.literalType = literalType;
		this.value = value;
	}
}

export class BinaryOp extends ASTNode {
	op: BinaryOpType;
	children: [ASTNode, ASTNode];

	constructor(op: BinaryOpType, lchild: ASTNode, rchild: ASTNode) {
		super(ASTNodeType.BinaryOp);

		this.op = op;
		this.children = [lchild, rchild];
	}
}