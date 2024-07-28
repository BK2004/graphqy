import { Literal } from "../scanning";
import { ASTNode } from "./astnodes";

export enum StatementType {
	Print,
	Expression,
	Var,
	Block,
	If,
}

export class Statement {
	statementType: StatementType;

	constructor(statementType: StatementType) {
		this.statementType = statementType;
	}
}

export class Expression extends Statement {
	expr: ASTNode;

	constructor(expr: ASTNode) {
		super(StatementType.Expression);
		this.expr = expr;
	}
}

export class Print extends Statement {
	expr: ASTNode;

	constructor(expr: ASTNode) {
		super(StatementType.Print);
		this.expr = expr;
	}
}

export class Var extends Statement {
	init?: ASTNode;
	name: string;
	const: boolean;
	line?: number;
	column?: number;

	constructor(name: Literal, isConst: boolean, init?: ASTNode, line?: number, column?: number) {
		super(StatementType.Var);

		this.name = name.value! as string;
		this.const = isConst;
		this.init = init;
		this.line = line;
		this.column = column;
	}
}

export class Block extends Statement {
	statements: Statement[];

	constructor() {
		super(StatementType.Block);

		this.statements = [];
	}
}

export class If extends Statement {
	condition: ASTNode;
	thenBlock: Block;
	elseIfBlocks?: {condition: ASTNode, block: Block}[];
	elseBlock?: Block;

	constructor(condition: ASTNode, thenBlock: Block, elseIfBlocks?: {condition: ASTNode, block: Block}[], elseBlock?: Block) {
		super(StatementType.If);

		this.condition = condition;
		this.thenBlock = thenBlock;
		this.elseIfBlocks = elseIfBlocks?.slice();
		this.elseBlock = elseBlock;
	}
}