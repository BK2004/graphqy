import { useRef } from 'react';
import Scanner from './interpreter/scanner';
import { Token } from './interpreter/tokens';
import CodeEditor from './components/CodeEditor';
import ControlBar from './components/ControlBar';
import { Error } from './interpreter/error';

function App() {
	const inputRef = useRef<HTMLTextAreaElement>(null);

	return (
		<div className="App h-screen overflow-y-auto flex flex-col justify-start bg-gray-100">
			<ControlBar onPlay={() => {
					const scanner = new Scanner(inputRef.current!.value);

					let token = scanner.scanNext();
					while (token instanceof Token && token.tokenType !== "EOF") {
						console.log(token);
						token = scanner.scanNext();
					}
					
					if (token instanceof Error) {
						console.log(token.fmtString());
					}
				}} onPause={() => console.log(inputRef.current?.value)} />
			<CodeEditor inputRef={inputRef} />
		</div>
	);
}

export default App;
