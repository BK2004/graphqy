import { useRef } from 'react';
import { Scanner, Token } from './interpreter/scanning'
import CodeEditor from './components/CodeEditor';
import ControlBar from './components/ControlBar';
import { ASTNode, Parser, printAST } from './interpreter/parsing';

function App() {
	const inputRef = useRef<HTMLTextAreaElement>(null);

	return (
		<div className="App h-screen overflow-y-auto flex flex-col justify-start bg-gray-100">
			<ControlBar onPlay={() => {
					const scanner = new Scanner(inputRef.current!.value);
					const err = scanner.scanTokens();

					if (err) {
						console.log(err.fmtString());
						return;
					}

					const parser = new Parser(scanner);
					const res = parser.parseExpression(0);
					if (res instanceof ASTNode) {
						printAST(res as ASTNode);
					} else {
						console.log(res);
					}
				}} onPause={() => console.log(inputRef.current?.value)} />
			<CodeEditor inputRef={inputRef} />
		</div>
	);
}

export default App;
