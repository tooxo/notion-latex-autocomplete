function boolean_to_number(b: boolean | null) {
    return b ? 1 : 0;
}

export function sort_value(ref: string, x: string, completion_ranking: Map<string, number>) {
    return (boolean_to_number(x.startsWith(ref)) + 0.5) * (completion_ranking.get(x)! + 1)
}

function getLengthBefore(nodeCursor: Node | null) {
    function is_final(elem: Node | null) {
        if (!(elem instanceof Element)) return false;
        return elem.matches("div.notranslate")
    }

    let previousLength = 0;

    while (!is_final(nodeCursor)) {
        nodeCursor = <Node>nodeCursor;
        if (nodeCursor.previousSibling !== null) {
            nodeCursor = nodeCursor.previousSibling;

            if (nodeCursor instanceof Text) {
                previousLength += nodeCursor.nodeValue!.length;
            } else if (nodeCursor instanceof HTMLElement) {
                previousLength += nodeCursor.innerText.length
            } else {
                debugger;
            }
        } else if (nodeCursor.parentNode !== null) {
            nodeCursor = nodeCursor.parentNode;
        } else {
            console.error("detached element");
            break
        }
    }

    return previousLength;
}

export function getCursorPosition() {
    let selection = window.getSelection();
    console.assert(selection !== null);
    return getLengthBefore(selection!.focusNode) + selection!.focusOffset;
}

export function setCursorPosition(target: Node, offset: number) {
    function elementLength(elem: Node) {
        if (elem instanceof HTMLElement) {
            return elem.innerText.length;
        } else if (elem instanceof Text) {
            return elem.nodeValue!.length;
        } else {
            debugger;
            return 0;
        }
    }

    let offs = offset - getLengthBefore(target);

    let selection = window.getSelection();
    console.assert(selection !== null);
    let range = selection!.getRangeAt(0)

    if (offs !== 0) {
        console.log("setting to ", target, "plus", offs);

        while (target instanceof Element) {
            let current_length = 0;
            for (let child of target.childNodes) {
                if (current_length + elementLength(child) >= offs) {
                    target = child;
                    offs -= current_length;
                    break;
                } else {
                    current_length += elementLength(child);
                }
            }
        }

        console.log("setting to ", target, "plus", offs);
        range.setStart(target, offs);
    } else {
        console.log("setting after", target);
        setCursorPositionAfter(target);
    }
}

function setCursorPositionAfter(target: Node) {
    const selection = window.getSelection();
    let range = selection!.getRangeAt(0);

    if (target instanceof Text || true) {
        range.setStartAfter(target);
    } else {
        console.assert(target.childNodes.length === 1);
        range.setStartAfter(target.childNodes[0]);
    }
}

export function findElementBeforePosition(target: Node, position: number) {
    for (let child of target.childNodes) {
        let length;
        if (child instanceof Text) {
            length = child.data.length;
        } else if (child instanceof HTMLElement) {
            length = child.innerText.length;
        } else {
            length = 0;
            debugger;
        }
        if (length < position) {
            position -= length;
        } else {
            return child;
        }
    }

    return target;
}
