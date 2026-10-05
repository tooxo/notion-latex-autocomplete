import katex from "katex";
import {all_functions} from "../constants"

let tbody = document.getElementById('tbody')!;

console.log(all_functions);

for (let item of all_functions) {
    let row = document.createElement('tr');

    let type = document.createElement('td');
    type.innerText = item.getType();

    let text = document.createElement('td');
    text.innerText = item.empty();
    let katex_elem = document.createElement('td');

    try {
        katex.render(item.render(), katex_elem, {
            throwOnError: false
        });
    } catch (e) {
    }

    row.appendChild(type);
    row.appendChild(text);
    row.appendChild(katex_elem);

    tbody.appendChild(row);
}
