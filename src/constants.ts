// noinspection ES6UnusedImports
import katex from "katex";
// @ts-expect-error
import katexFunctions from "katex/src/functions";
// @ts-expect-error
import katexEnvironments from "katex/src/environments";
// @ts-expect-error
import katexMacros from "katex/src/macros";
// @ts-expect-error
import katexSymbols from "katex/src/symbols";

enum ArgumentType {
    any,
    bracket,
    size,
    url,
    color
}

type FunctionType =
    "accent"
    | "accentUnder"
    | "xArrow"
    | "mclass"
    | "pmb"
    | "textord"
    | "color"
    | "delimsizing"
    | "leftright-right"
    | "leftright"
    | "middle"
    | "enclose"
    | "text"
    | "font"
    | "genfrac"
    | "infix"
    | "horizBrace"
    | "href"
    | "hbox"
    | "htmlmathml"
    | "kern"
    | "lap"
    | "styling"
    | "mathchoice"
    | "op"
    | "operatorname"
    | "overline"
    | "phantom"
    | "vphantom"
    | "raisebox"
    | "reflectbox"
    | "sizing"
    | "smash"
    | "sqrt"
    | "underline"
    | "vcenter"
    | "verb"
    | "environment"
    | "macro"
    | "symbol"
    | "rule"
    | "internal"
    | "html"
    | "includegraphics"
    | "cdlabel"
    | "cdlabelparent";

function parseArgumentTypes(numArgs: number, inp: string[] | undefined): ArgumentType[] {
    if (inp === undefined) return Array.from({length: numArgs}, () => ArgumentType.any);

    let types: ArgumentType[] = [];
    for (let ty of inp) {
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
            let bra = optional ? "[" : "{";
            let ket = optional ? "]" : "}";
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

        if (this.isColour())
            for (let i = 0; i < this.optionalArgs.length; i++) {
                katexString += nextArg(ArgumentType.color, true);
            }

        for (let i = 0; i < this.args.length; i++) {
            katexString += nextArg(this.args[i], false);
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

        for (let i = 0; i < this.optionalArgs.length; i++) {
            str[str.length - 1] += "[";
            str.push("]");
        }
        for (let i = 0; i < this.args.length; i++) {
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
    const functions: Record<string, {
        numArgs: number,
        numOptionalArgs: number,
        type: FunctionType,
        argTypes?: string[]
    }> = katexFunctions;
    const ignored_function_types: FunctionType[] = ["environment", "rule", "internal", "html", "includegraphics", "cdlabel", "cdlabelparent", "textord"];
    const ignored_functions: string[] = [];
    for (const key of Object.keys(functions)) {
        if (!key.startsWith("\\")) continue;
        if (key.startsWith("\\\\")) continue;
        let fn = functions[key];
        if (ignored_function_types.includes(fn.type) || ignored_functions.includes(key)) continue;

        let args = parseArgumentTypes(fn.numArgs, fn.argTypes);
        if (fn.type === "delimsizing")
            args = Array.from({length: fn.numArgs}, () => ArgumentType.bracket);

        let katexFunction = new KatexFunction(key.replaceAll("\\", ""), fn.type, args, parseArgumentTypes(fn.numOptionalArgs, undefined));
        all_functions.push(katexFunction);
    }

    const environments: Record<string, { numArgs: number, argTypes?: string[] }> = katexEnvironments;
    for (let e_group of Object.keys(environments)) {
        all_functions.push(new KatexFunction(e_group, "environment", parseArgumentTypes(environments[e_group].numArgs, environments[e_group].argTypes), []));
    }

    const macros: Record<string, any> = katexMacros;
    const ignored_macros: string[] = ["\\bra@ket", "\\bra@set", "\\@hspace", "\\@hspacer"];
    for (let key of Object.keys(macros)) {
        if (!key.startsWith("\\")) continue;
        if (ignored_macros.includes(key)) continue;
        let numArgs = 0;
        if (macros[key].numArgs !== undefined) {
            numArgs = macros[key].numArgs;
        }
        if (typeof macros[key] === "string") {
            numArgs = new Array(...macros[key].matchAll(/(?<=[^#])#\d+/g)).map(a => a["0"]).length;
        }
        let fun = new KatexFunction(key.replaceAll("\\", ""), "macro", parseArgumentTypes(numArgs, undefined), []);
        all_functions.push(fun);
    }

    const symbols: Record<string, Record<string, { font: string, group: string, replace: string }>> = katexSymbols;
    const symbols_ignored_groups = ["accent-token"]
    for (let symbol of Object.keys(symbols["math"])) {
        if (!symbol.startsWith("\\")) continue;
        if (symbols_ignored_groups.includes(symbols["math"][symbol].group)) continue;

        all_functions.push(new KatexFunction(symbol.replaceAll("\\", ""), "symbol", [], []));
    }
} catch (e) {
    console.error("error loading katex functions from library", e)
}
