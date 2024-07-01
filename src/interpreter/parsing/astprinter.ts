import { ASTLiteral, ASTNode, ASTNodeType, BinaryOp, UnaryOp } from "./astnodes";

// printAST
// 	prints an AST
// 	@params:
// 		root - root AST Node of tree to print
// 	@returns:
export const printAST = (root: ASTNode) => {
	console.log(astToString(root))
}

const astToString = (ast: ASTNode): string => {
	switch (ast.nodeType) {
		case ASTNodeType.Literal:
			return (ast as ASTLiteral).value.toString();
		case ASTNodeType.BinaryOp:
			return `(${astToString((ast as BinaryOp).children[0])} ${(ast as BinaryOp).op} ${astToString((ast as BinaryOp).children[1])})`;
		case ASTNodeType.UnaryOp:
			return `(${(ast as UnaryOp).op}${astToString((ast as UnaryOp).child)})`;
	}
}