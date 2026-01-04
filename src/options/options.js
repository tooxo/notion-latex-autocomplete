let p = document.getElementById('p');

console.log(all_flattened);

for (let item of all_flattened) {
    let alphabet = "abcdefghijklmn";
    let i = 0;

    while (item.includes("$$")) {
        item = item.replace("$$", alphabet[i]);
        i++;
    }

    let div = document.createElement('div');
    let text = document.createElement('p');
    text.innerText = item;
    let katex_elem = document.createElement('div');

    let suff = "";
    if (delimiter_sizing.includes(item)) suff = " ("

    try {
        katex.render("\\" + item + suff, katex_elem, {
            throwOnError: false
        });
    } catch (e) {}


    div.appendChild(text);
    div.appendChild(katex_elem);

    p.appendChild(div);
}


let area = document.getElementById("area");
let button = document.getElementById("button");
console.log(button);
button.addEventListener("click", () => {
    (async () => {
            let response = await prettier_plugin_latex.printPrettier(
                area.value,
                {
                    tabWidth: 2,
                    useTabs: false,
                    printWidth: 40
                }
            );
            console.log(response);

            return response;
        }
    )();
})

