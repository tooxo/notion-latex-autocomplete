import re
import json
from os import listdir

normals = list(listdir("input"))
normals.remove("environment")
normals.sort()

f = open("constants.js","w")
f.write("// This file was automatically generated. Do not touch.\n\n")
for nor in normals:
    print(nor)
    c = json.load(open("input/"+nor, "r"))
    flea = []
    for n in c:
        n = n.replace("\\", "")
        n = n.replace("\\", "")
        n = re.sub(r"{}", "{$$}", n)
        flea.append(n)
    flea.sort()
    print(flea)

    f.write("const " + nor + "= " + json.dumps(flea) + ";\n")

env = json.load(open("input/environment", "r"))
env.sort()
p = []
for e in env:
    p.append(
        "begin{"+e+"}$$\end{"+e+"}"
    )
f.write("const environment = " + json.dumps(p) + ";\n")
f.write("\n")

f.write("const all = [" + ", ".join(listdir("input")) + "];")
f.close()
