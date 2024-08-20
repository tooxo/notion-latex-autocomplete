const layout_spacing= ["kern{$$}", "thinspace", "mkern{$$}", "mskip{$$}", "hskip{$$}", "medspace", "hspace{$$}", "hspace*{$$}", "thickspace", "phantom{$$}", "enspace", "hphantom{$$}", "quad", "vphantom{$$}", "qquad", "negthinspace", "negmedspace", "nobreakspace", "negthickspace", "space", "mathstrut", "vphantom{$$}"];
const delimiters= ["lparen", "rparen", "lceil", "rceil", "uparrow", "lbrack", "rbrack", "lfloor", "rfloor", "downarrow", "lbrace", "rbrace", "lmoustache", "rmoustache", "updownarrow", "langle", "rangle", "lgroup", "rgroup", "Uparrow", "vert", "ulcorner", "urcorner", "Downarrow", "Vert", "llcorner", "lrcorner", "Updownarrow", "lvert", "rvert", "lVert", "rVert", "left.", "right.", "backslash", "lang", "rang", "lt gt", "llbracket", "rrbracket", "lBrace", "rBrace"];
const arrows= ["swarrow", "xleftrightharpoons{$$}", "Lleftarrow", "Leftarrow", "hookrightarrow", "Rrightarrow", "xLeftrightarrow{$$}", "leadsto", "uArr", "curvearrowleft", "curvearrowright", "dArr", "xleftharpoondown{$$}", "hookleftarrow", "leftrightsquigarrow", "nearrow", "xmapsto{$$}", "Darr", "xrightharpoondown{$$}", "hArr", "downharpoonleft", "nrightarrow", "Rightarrow", "Rsh", "downharpoonright", "looparrowright", "nleftarrow", "harr", "iff", "nwarrow", "xrightleftharpoons{$$}", "looparrowleft", "implies", "circlearrowright", "twoheadleftarrow", "downdownarrows", "leftrightharpoons", "rArr", "Lsh", "Lrarr", "leftrightarrow", "Leftrightarrow", "rightrightarrows", "downarrow", "leftarrow", "Downarrow", "longrightarrow", "dashleftarrow", "leftharpoondown", "darr", "upharpoonright", "circlearrowleft", "xrightarrow[under]{$$}", "xrightharpoonup{$$}", "upuparrows", "leftrightarrows", "lrArr", "lrarr", "restriction", "twoheadrightarrow", "longleftarrow", "Longrightarrow", "xlongequal{$$}", "xleftharpoonup{$$}", "xtwoheadrightarrow{$$}", "xhookleftarrow{$$}", "xhookrightarrow{$$}", "rightarrow", "rightarrowtail", "Uarr", "uparrow", "rightleftharpoons", "nLeftarrow", "Rarr", "rightharpoondown", "rightleftarrows", "uarr", "impliedby", "Larr", "mapsto", "xleftarrow{$$}", "longleftrightarrow", "upharpoonleft", "to", "leftharpoonup", "leftleftarrows", "Updownarrow", "rarr", "rightharpoonup", "Uparrow", "Harr", "rightsquigarrow", "lArr", "larr", "xLeftarrow{$$}", "gets", "updownarrow", "xtofrom{$$}", "xtwoheadleftarrow{$$}", "nLeftrightarrow", "dashrightarrow", "Longleftrightarrow", "nRightarrow", "nleftrightarrow", "xleftrightarrow{$$}", "searrow", "leftarrowtail", "xRightarrow{$$}", "longmapsto", "Longleftarrow"];
const logic= ["forall", "complement", "therefore", "emptyset", "exists", "subset", "because", "empty", "exist", "supset", "mapsto", "varnothing", "nexists", "mid", "to", "implies", "in", "land", "gets", "impliedby", "isin", "lor", "leftrightarrow", "iff", "notin", "ni", "notni", "neg", "lnot", "Set{$$}", "set{$$}"];
const layout_annotation= ["cancel{$$}", "bcancel{$$}", "xcancel{$$}", "sout{$$}", "not{$$}", "sout{$$}", "boxed{$$}", "angl{$$}", "phase{$$}", "tag{$$}", "tag*{$$}"];
const symbols= ["dotsm", "pounds", "sdot", "sphericalangle", "diagup", "bigstar", "clubs", "colon", "clubsuit", "triangle", "cdots", "mathsterling", "ddag", "yen", "bot", "rq", "blacklozenge", "text{$$}", "star", "spadesuit", "degree", "top", "blacktriangledown", "diamondsuit", "diamonds", "prime", "bigtriangledown", "dotso", "blacktriangle", "flat", "sharp", "KaTeX", "maltese", "dotsc", "ldots", "backprime", "TeX", "infty", "hearts", "ddots", "nabla", "circledR", "copyright", "natural", "heartsuit", "diagdown", "surd", "ddagger", "triangleleft", "spades", "infin", "Diamond", "blacktriangleright", "circledS", "P", "dotsi", "blacksquare", "diamond", "dagger", "LaTeX", "lozenge", "dag", "dots", "$", "triangledown", "checkmark", "bigtriangleup", "Box", "%", "dotsb", "triangleright", "vdots", "Dagger", "blacktriangleleft", "angle", "mathellipsis", "minuso", "mho", "S", "measuredangle", "square", "lq"];
const layout_vertical= ["stackrel{$$}{$$}", "overset{$$}{$$}", "underset{$$}{$$}", "raisebox{$$}{$$}{$$}", "substack{$$}"];
const fonts= ["textit{$$}", "mathrm{$$}", "mathcal{$$}", "mathit{$$}", "tt{$$}", "small", "textup{$$}", "texttt{$$}", "huge", "textrm{$$}", "textbf{$$}", "frak{$$}", "Large", "mathscr{$$}", "rm{$$}", "mathfrak{$$}", "Huge", "tinB", "it{$$}", "bf{$$}", "large", "scriptsize", "textnormal{$$}", "mathnormal{$$}", "textsf{$$}", "LARGE", "mathbf{$$}", "Bbb{$$}", "mathsf{$$}", "normalsize", "mathtt{$$}", "footnotesize", "bold{$$}", "sf{$$}", "boldsymbol{$$}", "emph{$$}", "mathbb{$$}", "bm{$$}", "cal{$$}", "textmd{$$}", "text{$$}"];
const html= ["href{$$}", "url{$$}", "includegraphics[]{$$}", "htmlId{$$}{$$}", "htmlClass{$$}{$$}", "htmlStyle{$$}{$$}", "htmlData{$$}{$$}"];
const accents= ["vec{$$}", "grave{$$}", "overleftrightarrow{$$}", "breve{$$}", "overgroup{$$}", "underleftrightarrow{$$}", "underleftarrow{$$}", "widehat{$$}", "hat{$$}", "overlinesegment{$$}", "dot{$$}", "overline{$$}", "widetilde{$$}", "bar{$$}", "undergroup{$$}", "underbrace{$$}", "check{$$}", "utilde{$$}", "overleftarrow{$$}", "overbrace{$$}", "acute{$$}", "underline{$$}", "overleftharpoon{$$}", "ddot{$$}", "overrightarrow{$$}", "underbar{$$}", "overrightharpoon{$$}", "mathring{$$}", "underrightarrow{$$}", "underlinesegment{$$}", "widecheck{$$}", "tilde{$$}", "Overrightarrow{$$}"];
const operators= ["bigoplus", "varprojlim", "uplus", "lim", "coth", "tg", "bigcup", "unrhd", "doublecap", "lor", "arctg", "boxplus", "det", "liminf", "oslash", "oplus", "oiint", "bigodot", "inf", "sum", "Pr", "setminus", "plusmn", "ln", "arccos", "circledast", "sqrt[]{$$}", "gtrdot", "argmax", "sup", "iint", "boxminus", "bigsqcup", "sqrt{$$}", "sec", "sinh", "dotplus", "operatorname*{$$}", "coprod", "Cup", "rightthreetimes", "And", "ltimes", "wr", "sqcup", "arg", "th", "doublecup", "tan", "cosec", "plim", "Cap", "ch", "oiiint", "land", "times", "exp", "div", "int", "hom", "ctg", "smallint", "varinjlim", "ldotp", "ominus", "dbinom{$$}", "varlimsup", "pmod", "prod", "limsup", "frac{$$}{$$}", "biguplus", "doublebarwedge", "sh", "lessdot", "bigcirc", "projlim", "cosh", "bigotimes", "iiint", "csc", "varliminf", "cfrac{$$}{$$}", "deg", "arcctg", "rtimes", "amalg", "min", "leftthreetimes", "odot", "cup", "vee", "veebar", "cot", "cotg", "binom{$$}", "unlhd", "bullet", "circleddash", "bmod", "cap", "barwedge", "intop", "max", "rhd", "sin", "mp", "smallsetminus", "tanh", "dim", "log", "boxtimes", "injlim", "arcsin", "boxdot", "tbinom{$$}", "mod", "pod", "arctan", "cos", "bigvee", "cdot", "lhd", "circledcirc", "circ", "centerdot", "sqcap", "cth", "bigwedge", "curlywedge", "tfrac{$$}{$$}", "ker", "argmin", "curlyvee", "bigcap", "pm", "operatornamewithlimits{$$}", "wedge", "intercal", "operatorname{$$}", "otimes", "oint", "divideontimes", "lg", "gcd", "ast", "dfrac{$$}{$$}", "cdotp"];
const letters= ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega", "varGamma", "varDelta", "varTheta", "varLambda", "varXi", "varPi", "varSigma", "varUpsilon", "varPhi", "varPsi", "varOmega", "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa", "lambda", "mu", "nu", "xi", "omicron", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega", "varepsilon", "varkappa", "vartheta", "thetasym", "varpi", "varrho", "varsigma", "varphi", "digamma", "imath", "nabla", "Im", "Reals", "jmath", "partial", "image", "wp", "text{$$}", "aleph", "Game", "Bbbk", "weierp", "alef", "Finv", "N", "Z", "alefsym", "cnums", "natnums", "beth", "Complex", "R", "gimel", "ell", "Re", "daleth", "hbar", "real", "eth", "hslash", "reals"];
const relations= ["doteqdot", "lessapprox", "smile", "eqcirc", "lesseqgtr", "sqsubset", "eqcolon", "minuscolon", "lesseqqgtr", "sqsubseteq", "Eqcolon", "minuscoloncolon", "lessgtr", "sqsupset", "approx", "eqqcolon", "equalscolon", "lesssim", "sqsupseteq", "approxcolon", "Eqqcolon", "equalscoloncolon", "ll", "Subset", "approxcoloncolon", "eqsim", "lll", "subset", "sub", "approxeq", "eqslantgtr", "llless", "subseteq", "sube", "asymp", "eqslantless", "lt", "subseteqq", "backepsilon", "equiv", "mid", "succ", "backsim", "fallingdotseq", "models", "succapprox", "backsimeq", "frown", "multimap", "succcurlyeq", "between", "ge", "origof", "succeq", "bowtie", "geq", "owns", "succsim", "bumpeq", "geqq", "parallel", "Supset", "Bumpeq", "geqslant", "perp", "supset", "circeq", "gg", "pitchfork", "supseteq", "supe", "colonapprox", "ggg", "prec", "supseteqq", "Colonapprox", "coloncolonapprox", "gggtr", "precapprox", "thickapprox", "coloneq", "colonminus", "gt", "preccurlyeq", "thicksim", "Coloneq", "coloncolonminus", "gtrapprox", "preceq", "trianglelefteq", "coloneqq", "colonequals", "gtreqless", "precsim", "triangleq", "Coloneqq", "coloncolonequals", "gtreqqless", "propto", "trianglerighteq", "colonsim", "gtrless", "risingdotseq", "varpropto", "Colonsim", "coloncolonsim", "gtrsim", "shortmid", "vartriangle", "cong", "imageof", "shortparallel", "vartriangleleft", "curlyeqprec", "in", "isin", "sim", "vartriangleright", "curlyeqsucc", "Join", "simcolon", "vcentcolon", "ratio", "dashv", "le", "simcoloncolon", "vdash", "dblcolon", "coloncolon", "leq", "simeq", "vDash", "doteq", "leqq", "smallfrown", "Vdash", "Doteq", "leqslant", "smallsmile", "Vvdash", "gnapprox", "ngeqslant", "nsubseteq", "precneqq", "gneq", "ngtr", "nsubseteqq", "precnsim", "gneqq", "nleq", "nsucc", "subsetneq", "gnsim", "nleqq", "nsucceq", "subsetneqq", "gvertneqq", "nleqslant", "nsupseteq", "succnapprox", "lnapprox", "nless", "nsupseteqq", "succneqq", "lneq", "nmid", "ntriangleleft", "succnsim", "lneqq", "notin", "ntrianglelefteq", "supsetneq", "lnsim", "notni", "ntriangleright", "supsetneqq", "lvertneqq", "nparallel", "ntrianglerighteq", "varsubsetneq", "ncong", "nprec", "nvdash", "varsubsetneqq", "ne", "npreceq", "nvDash", "varsupsetneq", "neq", "nshortmid", "nVDash", "varsupsetneqq", "ngeq", "nshortparallel", "nVdash", "ngeqq", "nsim", "precnapprox"];
const color= ["color{$$}", "textcolor{$$}{$$}", "colorbox{$$}{$$}", "fcolorbox{$$}{$$}{$$}"];
const delimiter_sizing= ["big", "Big", "bigg", "Bigg", "left", "big", "bigl", "bigm", "bigr", "middle", "Big", "Bigl", "Bigm", "Bigr", "right", "bigg", "biggl", "biggm", "biggr", "Bigg", "Biggl", "Biggm", "Biggr"];
const environment = ["begin{matrix}$$\\end{matrix}", "begin{array}$$\\end{array}", "begin{pmatrix}$$\\end{pmatrix}", "begin{bmatrix}$$\\end{bmatrix}", "begin{vmatrix}$$\\end{vmatrix}", "begin{Vmatrix}$$\\end{Vmatrix}", "begin{Bmatrix}$$\\end{Bmatrix}", "begin{cases}$$\\end{cases}", "begin{rcases}$$\\end{rcases}", "begin{smallmatrix}$$\\end{smallmatrix}", "begin{subarray}$$\\end{subarray}", "begin{darray}$$\\end{darray}", "begin{dcases}$$\\end{dcases}", "begin{drcases}$$\\end{drcases}", "begin{matrix*}$$\\end{matrix*}", "begin{pmatrix*}$$\\end{pmatrix*}", "begin{bmatrix*}$$\\end{bmatrix*}", "begin{Bmatrix*}$$\\end{Bmatrix*}", "begin{vmatrix*}$$\\end{vmatrix*}", "begin{Vmatrix*}$$\\end{Vmatrix*}", "begin{alignment}$$\\end{alignment}", "begin{equation*}$$\\end{equation*}", "begin{gather*}$$\\end{gather*}", "begin{align*}$$\\end{align*}", "begin{alignat*}$$\\end{alignat*}", "begin{gathered}$$\\end{gathered}", "begin{aligned}$$\\end{aligned}", "begin{alignedat}$$\\end{alignedat}"];

const all = [delimiter_sizing, letters, accents, operators, delimiters, relations, color, layout_spacing, logic, layout_vertical, html, layout_annotation, symbols, environment, arrows, fonts];