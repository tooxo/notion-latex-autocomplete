"use strict"
// noinspection ES6UnusedImports
import katex from "katex";
import katexFunctions, { FunctionType } from "katex/src/functions";
import katexEnvironments from "katex/src/environments";
import katexMacros from "katex/src/macros";
import katexSymbols from "katex/src/symbols";

export type { FunctionType };

enum ArgumentType {
    any,
    bracket,
    size,
    url,
    color
}

function parseArgumentTypes(numArgs: number, inp: string[] | undefined): ArgumentType[] {
    if (inp === undefined) return Array.from({length: numArgs}, () => ArgumentType.any);

    const types: ArgumentType[] = [];
    for (const ty of inp) {
        switch (ty) {
            case "size":
                types.push(ArgumentType.size);
                break;
            case "color":
                types.push(ArgumentType.color);
                break;
            case "url":
                types.push(ArgumentType.url);
                break;
            default:
                types.push(ArgumentType.any);
                break;
        }
    }
    return types;
}

export class KatexFunction {
    private readonly name: string;
    private readonly type: FunctionType;

    private readonly args: ArgumentType[];
    private readonly optionalArgs: ArgumentType[];

    constructor(name: string, type: FunctionType, args: ArgumentType[], optionalArgs: ArgumentType[]) {
        this.name = name;
        this.type = type;
        this.args = args;
        this.optionalArgs = optionalArgs;
    }

    public getType() {
        return this.type;
    }

    public isColour() {
        return this.type == "color";
    }

    public isEnvironment() {
        return this.type == "environment";
    }

    public render(): string {
        if (this.isEnvironment()) return "";

        let katexString = "\\" + this.name;
        const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        const urls = ["https://example.com", "https://app.notion.so/"]
        const delim_alphabet = "[({".split("");
        const colours = ["#ecec93", "#eb5757", "#2783de"];
        const sizes = ["1em", "2em", "3em", "4em"];

        function nextArg(arg: ArgumentType, optional: boolean): string {
            const bra = optional ? "[" : "{";
            const ket = optional ? "]" : "}";
            switch (arg) {
                case ArgumentType.color:
                    return bra + colours.shift()! + ket;
                case ArgumentType.bracket:
                    return delim_alphabet.shift()!;
                case ArgumentType.any:
                    return bra + alphabet.shift()! + ket;
                case ArgumentType.url:
                    return bra + urls.shift()! + ket;
                case ArgumentType.size:
                    return bra + sizes.shift()! + ket;
            }
        }

        if (this.isColour()) {
            for (const _ of this.optionalArgs) {
                katexString += nextArg(ArgumentType.color, true);
            }
        }

        for (const arg of this.args) {
            katexString += nextArg(arg, false);
        }
        return katexString;
    }

    public empty() {
        return this.name + "[]".repeat(this.optionalArgs.length) + "{}".repeat(this.args.length);
    }

    public partwise() {
        let str;
        if (this.isEnvironment()) {
            str = ["\\begin{" + this.name + "}"];
        } else {
            str = ["\\" + this.name];
        }

        if (this.args.length === 0 && this.optionalArgs.length === 0 && !this.isEnvironment()) {
            str[0] += " ";
        }

        for (const _ of this.optionalArgs) {
            str[str.length - 1] += "[";
            str.push("]");
        }
        for (const _ of this.args) {
            str[str.length - 1] += "{";
            str.push("}");
        }

        if (this.isEnvironment()) {
            str.push("\\end{" + this.name + "}");
        }
        return str;
    }

    public string() {
        return this.partwise().join("");
    }

    public matches(query: string, ignoreCase = false): boolean {
        if (query.startsWith("\\")) query = query.substring(1);
        return ignoreCase ? this.empty().toLowerCase().includes(query.toLowerCase()) : this.empty().includes(query);
    }
}

export const all_functions: KatexFunction[] = [];
try {
    const functions = katexFunctions;
    const ignored_function_types: FunctionType[] = ["environment", "rule", "internal", "html", "includegraphics", "cdlabel", "cdlabelparent", "textord"];
    for (const key of Object.keys(functions)) {
        if (!key.startsWith("\\") || key.startsWith("\\\\")) continue;
        const fn = functions[key];
        if (ignored_function_types.includes(fn.type)) continue;

        let args = parseArgumentTypes(fn.numArgs, fn.argTypes);
        if (fn.type === "delimsizing")
            args = Array.from({length: fn.numArgs}, () => ArgumentType.bracket);

        const katexFunction = new KatexFunction(key.replaceAll("\\", ""), fn.type, args, parseArgumentTypes(fn.numOptionalArgs, undefined));
        all_functions.push(katexFunction);
    }

    const environments = katexEnvironments;
    for (const e_group of Object.keys(environments)) {
        all_functions.push(new KatexFunction(e_group, "environment", parseArgumentTypes(environments[e_group].numArgs, environments[e_group].argTypes), []));
    }

    const macros = katexMacros;
    const ignored_macros: string[] = ["\\bra@ket", "\\bra@set", "\\@hspace", "\\@hspacer"];
    for (const key of Object.keys(macros)) {
        if (!key.startsWith("\\")) continue;
        if (ignored_macros.includes(key)) continue;
        let numArgs = 0;
        const macro = macros[key];
        if (typeof macro === "object" && macro?.numArgs !== undefined) {
            numArgs = macro.numArgs;
        }
        if (typeof macro === "string") {
            numArgs = new Array(...macro.matchAll(/(?<=[^#])#\d+/g)).map(a => a["0"]).length;
        }
        const fun = new KatexFunction(key.replaceAll("\\", ""), "macro", parseArgumentTypes(numArgs, undefined), []);
        all_functions.push(fun);
    }

    const symbols = katexSymbols;
    const symbols_ignored_groups = ["accent-token"]
    for (const symbol of Object.keys(symbols.math)) {
        if (!symbol.startsWith("\\")) continue;
        if (symbols_ignored_groups.includes(symbols.math[symbol].group)) continue;

        all_functions.push(new KatexFunction(symbol.replaceAll("\\", ""), "symbol", [], []));
    }
} catch (e) {
    console.error("error loading katex functions from library", e)
}
