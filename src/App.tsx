import React from 'react';
import CodeEditor from './components/CodeEditor';

function App() {
return (
	<div className="App p-4 h-screen overflow-y-auto">
		<CodeEditor init={"hi"} />
	</div>
);
}

export default App;
