import katex from "katex";
import {all_functions} from "../constants"

const tbody = document.getElementById('tbody')!;

console.log(all_functions);

for (const item of all_functions) {
    const row = document.createElement('tr');

    const type = document.createElement('td');
    type.innerText = item.getType();

    const text = document.createElement('td');
    text.innerText = item.empty();
    const katex_elem = document.createElement('td');

    const latex = item.render();

    try {
        katex.render(latex, katex_elem, {
            throwOnError: false
        });
    } catch (e) {
        console.log(e);
    }

    const latex_elem = document.createElement('td');
    latex_elem.innerText = latex;

    row.appendChild(type);
    row.appendChild(text);
    row.appendChild(katex_elem);
    row.appendChild(latex_elem);

    tbody.appendChild(row);
}
