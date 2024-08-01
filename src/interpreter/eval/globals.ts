import { Function } from "./dataTypes";
import { Environment } from "./environment"

const NATIVES: Record<string, Function> = {
	print: new Function([], true, (...expr) => console.log(...expr)),
	tick: new Function([], true, () => new Date().getTime()),
}

const defineNatives = (environment: Environment) => {
	for (const [key, value] of Object.entries(NATIVES)) {
		environment.newVar(key, true, value);
	}
}

export const Globals = {
	defineNatives
}