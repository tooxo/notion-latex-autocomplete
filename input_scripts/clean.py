import re
import json

i = "input/symbols"
input_array = json.loads(open(i, "r").read())

filter = []

for x in input_array:
    if "\\" not in x or "&" in x:
        continue
    filter.append(x)

remove_args = []

for x in filter:
    remove_args.append(re.sub(r"{.*}", "{}", x))


seconds= []
for x in remove_args:
    if "\\" not in x or "&" in x:
        continue
    seconds.append(x)


print(json.dumps(list(set(seconds))))