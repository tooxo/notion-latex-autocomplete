declare module "katex/src/functions" {
    export type FunctionType =
        | "accent"
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

    export interface FunctionDef {
        numArgs: number;
        numOptionalArgs: number;
        type: FunctionType;
        argTypes?: string[];
    }
    const functions: Record<string, FunctionDef>;
    // noinspection JSUnusedGlobalSymbols
    export default functions;
}

declare module "katex/src/environments" {
    export interface EnvironmentDef {
        numArgs: number;
        argTypes?: string[];
    }
    const environments: Record<string, EnvironmentDef>;
    // noinspection JSUnusedGlobalSymbols
    export default environments;
}

declare module "katex/src/macros" {
    export interface MacroDef {
        numArgs?: number;
    }
    const macros: Record<string, MacroDef | string>;
    export default macros;
}

declare module "katex/src/symbols" {
    export interface SymbolDef {
        font: string;
        group: string;
        replace: string;
    }
    const symbols: {
        math: Record<string, SymbolDef>;
        text: Record<string, SymbolDef>;
    };
    // noinspection JSUnusedGlobalSymbols
    export default symbols;
}
