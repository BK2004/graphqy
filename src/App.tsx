import { useRef } from 'react';
import { Scanner } from './interpreter/scanning'
import CodeEditor from './components/CodeEditor';
import ControlBar from './components/ControlBar';
import { Parser } from './interpreter/parsing';
import { Evaluator } from './interpreter/eval';

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
					const res = evaluator.next();
					console.log(res);
				}} onPause={() => console.log(inputRef.current?.value)} />
			<CodeEditor inputRef={inputRef} />
		</div>
	);
}

export default App;
