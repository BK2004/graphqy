import { Error, ErrorType } from "../error";

type VarData = {
	value?: any;
	const: boolean;
}
type Err<T> = Error | T

export enum EnvStateType {
	LOOP = "loop",
	FUNCTION = "function",
}

export class Environment {
	values: Map<string, VarData>;
	state?: EnvStateType;
	enclosing?: Environment;

	constructor(enclosing?: Environment, state?: EnvStateType) {
		this.values = new Map();
		this.enclosing = enclosing;
		if (!state && enclosing) this.state = enclosing.state
		else this.state = state
	}

	// get
	// 	Get value associated with a key. Errors if not defined
	// 	@params:
	// 		name - name of entry
	// 	@returns:
	// 		Value of entry
	get(name: string): Err<any> {
		if (!this.values.has(name)) {
			return this.enclosing ? this.enclosing.get(name) : new ErrorType.VarDNE(name)
		}

		const val = this.values.get(name)!.value;
		if (val === undefined) return null;
		return val;
	}

	// set
	// 	Set value of entry
	// 	@params:
	// 		name - name of entry
	// 		value - new value
	// 	@returns:
	// 		Old value, or error if there is one
	set(key: string, value: any): Err<void> {
		if (!this.values.has(key)) 
			return this.enclosing ? this.enclosing.set(key, value) : new ErrorType.VarDNE(key);
		const old = this.values.get(key)!;
		if (old.const && old.value !== undefined) return new ErrorType.ConstVar(key);

		old.value = value;
		this.values.set(key, old);
	}

	// newVar
	// 	Create new variable
	// 	@params:
	// 		name - name of variable
	// 		isConst - whether var is constant
	// 		value? - initial value (undefined if not initialized)
	// 	@returns:
	newVar(name: string, isConst: boolean, value?: any): Err<void> {
		if (this.values.has(name)) return new ErrorType.VarExists(name);

		this.values.set(name, {
			const: isConst,
			value: value
		});
	}
}