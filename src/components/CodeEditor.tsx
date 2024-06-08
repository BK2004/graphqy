import { useRef } from "react";

const KEYWORDS = [
	"let",
	"const",
	"while",
	"do",
	"if",
	"else",
	"elif",
	"function"
]

const isEntity = (() => {
	const textarea = document.createElement('textarea');
	return (entity: string) => {textarea.innerHTML = entity; return textarea.value !== entity;}
})();

const highlightString: (input: string) => string = (input: string) => {
	return input.replaceAll(/(<div>.*?<\/div>|".*?"|&[a-zA-Z0-9]+;|[a-zA-Z][a-zA-Z0-9_]*|[0-9]+)/g, (str) => {
		if (/<div>.*?<\/div>/.test(str)) {
			// Only highlight what is inside of divs
			return "<div>" + highlightString(str.substring(5, str.length - 6)) + "</div>";
		}
		
		if (str.match(/&[a-zA-Z0-9]+;/) !== null) {
			return isEntity(str) ? str 
				: highlightString(str[0]) 
				+ highlightString(str.substring(1, str.length - 1))
				+ highlightString(str.substring(str.length - 1));
		} else if (!isNaN(Number(str))) {
			// Matched string is a number literal
			return `<span class="num-literal">${str}</span>`;
		} else if (str.match(/^".*"$/) !== null) {
			// String literal
			return `<span class="string-literal">${str}</span>`;
		} else if (str.match(/^[a-zA-Z][a-zA-Z0-9_]*$/) !== null) {
			const str_class = ["true", "false"].includes(str) ? "bool-literal" : KEYWORDS.includes(str) ? "keyword" : "symbol";
			return `<span class="${str_class}">${str}</span>`;
		}
		// Ignore
		return str;
	});
}

const CodeEditor = () => {
	const highlightedRef = useRef<HTMLDivElement>(null);

	const onInput = (input: string) => {
		if (!highlightedRef.current) return;

		const highlightedLines = input.split("\n").map((str) => {
			const h = highlightString(str);
			return h;
		});

		highlightedRef.current.innerHTML = highlightedLines.map((v, i) => {
			return `<span class="relative line-num">${v}</span>`;
		}).join("<br>");
	}

	return (<div className="w-full h-fit relative bg-gray-200">
		<textarea className="appearance-none px-7 resize-none inline-block relative w-full overflow-y-auto break-words min-h-4 focus:border-none focus:outline-none bg-transparent text-transparent caret-black z-10"
			onInput={(e) => {
				e.currentTarget.style.height = "1px";
				e.currentTarget.style.height = (25 + e.currentTarget.scrollHeight) + "px";
				onInput(e.currentTarget.value);
			}}>
		</textarea>
		<pre>
			<div className="code-highlight absolute w-full h-full top-0 left-0 select-none" ref={highlightedRef}></div>
		</pre>
	</div>)
}

export default CodeEditor;