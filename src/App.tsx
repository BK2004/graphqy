import { useRef } from 'react';
import { Scanner } from './interpreter/scanning'
import CodeEditor from './components/CodeEditor';
import ControlBar from './components/ControlBar';
import { ASTNode, Parser } from './interpreter/parsing';
import { Evaluator } from './interpreter/eval';
import { Error } from './interpreter/error';

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
					const evaluator = new Evaluator(parser);
					const res = evaluator.interpret();
					if (res instanceof Error) console.log(res.fmtString());
				}} onPause={() => console.log(inputRef.current?.value)} />
			<CodeEditor inputRef={inputRef} />
		</div>
	);
}

export default App;
