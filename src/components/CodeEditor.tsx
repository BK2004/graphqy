import { useRef, useEffect, type RefObject } from "react";

const KEYWORDS = [
	"and",
	"or",
	"not",
]

interface Props {
	init?: string,
	inputRef: RefObject<HTMLTextAreaElement>,
}

const encodeString: (input: string) => string = (input: string) => {
	return input.replaceAll('&', '&amp;');
}

const highlightString: (input: string) => string = (input: string) => {
	return input.replaceAll(/(<div>.*?<\/div>|".*?"|[a-zA-Z][a-zA-Z0-9_]*|[0-9]+)/g, (str) => {
		if (/<div>.*?<\/div>/.test(str)) {
			// Only highlight what is inside of divs
			return "<div>" + highlightString(str.substring(5, str.length - 6)) + "</div>";
		}
		
		if (!isNaN(Number(str))) {
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

const CodeEditor = ({ init, inputRef }: Props) => {
	const highlightedRef = useRef<HTMLDivElement>(null);

	const onInput = (input: string) => {
		if (!highlightedRef.current) return;

		const highlightedLines = input.split("\n").map((str) => {
			const h = encodeString(highlightString(str));
			return h;
		});

		highlightedRef.current.innerHTML = highlightedLines.map((v, i) => {
			return `<span class="relative line-num block min-h-6">${v}</span>`;
		}).join("");
	}

	useEffect(() => {
		onInput(init || "");
	}, [init])

	return (<div className="min-w-full w-fit h-fit relative">
		<textarea spellCheck="false" className="appearance-none pl-12 pr-2 resize-none inline-block min-w-full relative text-nowrap overflow-y-auto focus:border-none focus:outline-none bg-transparent text-transparent caret-black z-10"
			onInput={(e) => {
				e.currentTarget.style.height = "1px";
				e.currentTarget.style.height = (25 + e.currentTarget.scrollHeight) + "px";
				onInput(e.currentTarget.value);
				if (highlightedRef.current) {
					highlightedRef.current.style.width = "1px";
					e.currentTarget.style.width = highlightedRef.current.scrollWidth + "px";
				}
			}}
			onKeyDown={(e) => {
				if (e.key == "Tab") {
					e.preventDefault();
				}
			}} 
			ref={inputRef} />
		<pre>
			<div className="code-highlight pl-12 pr-2 py-0 absolute w-full h-full top-0 left-0 select-none" ref={highlightedRef}></div>
		</pre>
	</div>)
}

export default CodeEditor;