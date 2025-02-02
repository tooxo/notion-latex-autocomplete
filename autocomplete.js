let debug = true;

let completionsDiv = document.createElement("div")
completionsDiv.id = "completions";

let completion_ranking = new Map()
for (let possibility of all_flattened) {
    completion_ranking.set(possibility, 0)
}

class JumpPoint {
    constructor(target, offset) {
        this.target = target;
        this.offset = offset;
    }

    target
    offset
}

class AutoCompleteState {
    active = false;
    allCompletions = all_flattened

    partial = ""
    currentlyFittingCompletions = []
    currentlySelected = 0

    jumpPoints = []

    lastCompletions = []
}

let state = new AutoCompleteState();

let overlayContainer = null;
const observer = new MutationObserver(callback);

function findOverlayContainer() {
    overlayContainer = document.querySelector(".notion-overlay-container.notion-default-overlay-container");
    if (overlayContainer !== null) {

        observer.observe(overlayContainer, {childList: true})
        overlayContainer.appendChild(completionsDiv)

        return
    }
    setTimeout(findOverlayContainer, 100)
}

findOverlayContainer()

function callback(mutationList, observer) {
    for (let mutation of mutationList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            console.log('A child node has been added:', mutation.addedNodes);
            // You can also access the added nodes like this:
            mutation.addedNodes.forEach(node => {

                let elements = node.querySelectorAll('div[role="dialog"] > div > .notranslate');
                if (elements.length > 0) {
                    console.log('Added node:', node);

                    let element = elements[0];
                    state.jumpPoints = []
                    addCallbacks(element);
                    updateCompletionList(element);
                }
            });
        }
        if (!debug) if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
            console.log('A child node has been removed:', mutation.removedNodes);
            mutation.removedNodes.forEach(node => {
                let elements = node.querySelectorAll('div[role="dialog"] > div > .notranslate');
                if (elements.length > 0) {
                    completionsDiv.style.display = 'none';
                    state = new AutoCompleteState();
                }
            })
        }
    }
}

function updatePositionCompletionList(target) {
    console.log("update position completionList");
    let selection = window.getSelection();

    if (selection !== null) {
        let fn = selection.focusNode;

        if (fn instanceof Text) {
            // if there is a "temp" node for rendering, we skip it
            if (!selection.focusNode.nodeValue.startsWith("\\")) {
                fn = selection.focusNode.previousSibling;
                target = fn;

            } else {
                target = fn.parentNode;
            }
        } else {
            target = fn;
        }
    } else {
        debugger;
    }

    if (target === null || target === undefined) {
        if (state.active) debugger; else return;
    }

    console.log("update position", selection.focusNode, target, target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px", target.getBoundingClientRect().left + "px", target.getBoundingClientRect().height + "px");

    completionsDiv.style.top = target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px";
    completionsDiv.style.left = target.getBoundingClientRect().left + "px";
}

function getLengthBefore(nodeCursor) {
    function is_final(elem) {
        if (!(elem instanceof Element)) return false;
        return elem.matches("div.notranslate")
    }

    let previousLength = 0;

    while (!is_final(nodeCursor)) {
        if (nodeCursor.previousSibling !== null) {
            nodeCursor = nodeCursor.previousSibling;

            if (nodeCursor instanceof Text) {
                previousLength += nodeCursor.nodeValue.length;
            } else {
                previousLength += nodeCursor.innerText.length
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

function getCursorPosition() {
    let selection = window.getSelection();
    return getLengthBefore(selection.focusNode) + selection.focusOffset;
}

function findElementBeforePosition(target, position) {
    for (let child of target.childNodes) {
        let length;
        if (child instanceof Text) {
            length = child.data.length;
        } else {
            length = child.innerText.length;
        }
        if (length < position) {
            position -= length;
        } else {
            if (length > position) {
                return [child, position]
            } else {
                return [child, 0]
            }
        }
    }
}

function setCursorPosition(target, position) {
    function elementLength(elem) {
        if (elem instanceof Element) {
            return elem.innerText.length;
        } else if (elem instanceof Text) {
            return elem.nodeValue.length;
        } else {
            debugger;
            return 0;
        }
    }

    let offs = position - getLengthBefore(target);

    let selection = window.getSelection();
    let range = selection.getRangeAt(0)

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

function setCursorPositionAfter(target) {
    const selection = window.getSelection();
    let range = selection.getRangeAt(0);

    if (target instanceof Text || true) {
        range.setStartAfter(target);
    } else {
        console.assert(target.childNodes.length === 1);
        range.setStartAfter(target.childNodes[0]);
    }
}

function sort_value(ref, x) {
    return (x.startsWith(ref) + 0.5) * (completion_ranking.get(x) + 1)
}

function updateCompletionList(target, updateLocation = true) {
    let previousSelection = state.currentlyFittingCompletions[state.currentlySelected]

    state.currentlyFittingCompletions = []
    completionsDiv.innerHTML = ''

    if (!state.active) {
        return;
    }

    let val = target.innerText

    let cursor = getCursorPosition();
    let subString = val.substring(0, cursor)
    if (!subString.includes("\\")) {
        return
    }
    let l = subString.split("\\")
    state.partial = l[l.length - 1]

    if (state.partial.includes(" ")) {
        return;
    }

    console.log("partial=", state.partial);
    if (state.partial.length === 0) {
        return
    }

    for (let lastSelectionElement of state.lastCompletions) {
        if (lastSelectionElement.replaceAll("$$", "").includes(state.partial)) {
            state.currentlyFittingCompletions.push(lastSelectionElement)
        }
    }

    let lowPriorityCurrent = []
    for (let completion of state.allCompletions) {
        if (completion.replaceAll("$$", "").includes(state.partial) && !lowPriorityCurrent.includes(completion) && !state.currentlyFittingCompletions.includes(completion)) {
            lowPriorityCurrent.push(completion)
        }
    }

    if (lowPriorityCurrent.length < 5) {
        for (let completion of state.allCompletions) {
            if (completion.toLowerCase().replaceAll("$$", "").includes(state.partial.toLowerCase()) && !lowPriorityCurrent.includes(completion) && !state.currentlyFittingCompletions.includes(completion)) {
                lowPriorityCurrent.push(completion)
            }
        }
    }

    lowPriorityCurrent.sort((a, b) => sort_value(state.partial, b) - sort_value(state.partial, a));
    state.currentlyFittingCompletions.push(...lowPriorityCurrent)
    state.currentlyFittingCompletions = state.currentlyFittingCompletions.flat()

    if (previousSelection !== undefined && state.currentlyFittingCompletions.slice(0, 5).includes(previousSelection)) {
        state.currentlySelected = state.currentlyFittingCompletions.indexOf(previousSelection)
    } else {
        state.currentlySelected = 0
    }

    console.log("currentlySelected=", state.currentlySelected)
    console.log(state.currentlyFittingCompletions)

    for (let i = 0; i < Math.min(5, state.currentlyFittingCompletions.length); i++) {
        let p_elem = document.createElement("p")
        completionsDiv.appendChild(p_elem)

        p_elem.hidden = true;

        let span_elem = document.createElement("span");
        span_elem.classList.add("name");

        if (katex !== undefined) {
            let katexString = state.currentlyFittingCompletions[i];
            let alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
            while (katexString.includes("$$")) {
                katexString = katexString.replace("$$", alphabet.shift());
            }
            if (delimiter_sizing.includes(katexString)) {
                katexString += "["
            }

            try {
                katex.render("\\" + katexString, p_elem, {
                    throwOnError: true
                });

                let katex_elem = p_elem.getElementsByClassName("katex").item(0);
                let wanted_height = katex_elem.scrollHeight;
                let height = katex_elem.getBoundingClientRect().height;

                // prevent overflow by scaling down
                if (Math.abs(wanted_height - height) > 1) {
                    // too far apart, scale

                    let scale = height / wanted_height;
                    katex_elem.setAttribute("style", "transform: scale(" + scale + ");");
                }
            } catch (err) {
                console.log("error while rendering", err);
                p_elem.appendChild(document.createElement("span"));
            }
        } else {
            console.log("katex is undefined!")
            p_elem.appendChild(document.createElement("span"));
        }
        p_elem.appendChild(span_elem);

        span_elem.innerHTML = state.currentlyFittingCompletions[i].replaceAll("$$", "")

        if (i === state.currentlySelected) {
            p_elem.classList.add("selected")
        }

        p_elem.hidden = false;
    }

    if (state.currentlyFittingCompletions.length === 0) {
        completionsDiv.style.display = "none"
    } else {
        completionsDiv.style.display = "block"
    }

    if (updateLocation) updatePositionCompletionList(target)
}


function acceptAutocompletion(target) {
    let value = target.innerText;

    let currentPos = getCursorPosition();

    let left = value.substring(0, currentPos)
    let right = value.substring(currentPos, value.length)

    let selectedElement = state.currentlyFittingCompletions[state.currentlySelected];

    let jumpPoints = []
    for (let part of selectedElement.split("$$")) {
        if (jumpPoints.length === 0) {
            jumpPoints.push(left.length - state.partial.length + part.length)
        } else {
            jumpPoints.push(jumpPoints[jumpPoints.length - 1] + part.length)
        }
    }

    if (!state.lastCompletions.includes(selectedElement)) {
        state.lastCompletions.push(selectedElement)
    }
    completion_ranking.set(selectedElement, completion_ranking.get(selectedElement) + 1);

    target.innerText = left.substring(0, left.length - state.partial.length) + selectedElement.replaceAll("$$", "") + right
    target.dispatchEvent(new InputEvent("input", {bubbles: true}))

    let newJumpPoints = []
    for (let jumpPoint of jumpPoints) {
        let p = findElementBeforePosition(target, jumpPoint);
        newJumpPoints.push(new JumpPoint(p[0], jumpPoint));
    }

    state.jumpPoints = newJumpPoints.concat(state.jumpPoints)
    console.log("cjp", state.jumpPoints)
    completionsDiv.style.display = "none"

    console.assert(jumpToNextJumpPoint() === true)

    state.active = false
}

function jumpToNextJumpPoint() {
    if (state.jumpPoints.length === 0) {
        return false;
    }

    let jp = state.jumpPoints.shift();
    console.log("jumping to", jp)
    setCursorPosition(jp.target, jp.offset);

    return true
}

function addCallbacks(element) {
    element.addEventListener('keydown', (e) => {
        switch (e.key) {
            case '\\':
                state.active = true
                console.log("+ complete active")
                break
            case "Escape":
                state.JumpPoints = []

            // noinspection FallThroughInSwitchStatementJS
            case " ":
                state.active = false
                console.log("- complete inactive")

                completionsDiv.style.display = "none"
                break
            case "Tab":
                if (!state.active && state.jumpPoints.length > 0) {
                    jumpToNextJumpPoint()
                } else if (state.active) {
                    if (state.currentlyFittingCompletions.length === 0 || !state.active) {
                        return
                    }

                    acceptAutocompletion(e.target)
                } else {
                    console.log("not active and no jumpp")
                    break
                }
                e.preventDefault()
                break
            case "ArrowDown":
                if (!state.active) {
                    return;
                }

                e.preventDefault()
                state.currentlySelected++;
                updateCompletionList(e.target, false)
                break
            case "ArrowUp":
                if (!state.active) {
                    return;
                }

                e.preventDefault()
                state.currentlySelected--;
                if (state.currentlySelected < 0) {
                    state.currentlySelected = Math.min(4, state.currentlyFittingCompletions.length - 1)
                }
                updateCompletionList(e.target, false)
                break
        }
    })

    function _length_changed(new_data, old_data) {
        return new_data.length - old_data.length;
    }

    let _last_input = null
    element.addEventListener('input', (e) => {
        updateCompletionList(e.target);

        let cursor_position = getCursorPosition();

        if (_last_input !== null) {
            let _l_ch = _length_changed(e.target.innerText, _last_input);

            if (_l_ch !== 0) {
                state.jumpPoints = state.jumpPoints.map((v) => {
                    if (v.offset >= cursor_position) {
                        return new JumpPoint(v.target, v.offset += _l_ch);
                    }
                    return v
                })
            }
        }
        _last_input = e.target.innerText;
    })

    element.addEventListener('blur', (e) => {
        if (!debug) {
            completionsDiv.style.display = "none";
            state = new AutoCompleteState();
        }
    })

    element.addEventListener('focusout', (e) => {
        console.log("focusout!")
    })

    let parkingLot;
    let mutationObserver = new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    let added = Array.from(mutation.addedNodes);
                    let removed = Array.from(mutation.removedNodes);

                    if (added.length > 0) {
                        if (added[added.length - 1].innerText === "") {
                            console.log("child (add temp skip)")
                            parkingLot = removed
                            continue;
                        }
                    }
                    if (removed.length > 0) {
                        if (removed[removed.length - 1].innerText === "") {
                            console.log("child (rem temp skip)")
                            removed = parkingLot
                        }
                    }

                    if (added.length !== removed.length) {
                        let i = 0;

                        for (; i < Math.min(removed.length); i++) {
                            if (added[i] === undefined) return

                            if (added[i].innerText !== removed[i].innerText) {
                                break
                            }
                        }

                        let jumpPointsToRemove = [];
                        for (let jp of state.jumpPoints) {
                            if (added.includes(jp.target) || Array.from(element.childNodes).includes(jp.target)) {
                                continue;
                            }

                            let oldIndex = removed.indexOf(jp.target);
                            if (oldIndex === -1) {
                                jumpPointsToRemove.push(jp)
                                continue
                            }

                            if (oldIndex < i) {
                                state.jumpPoints[state.jumpPoints.indexOf(jp)] = new JumpPoint(added[oldIndex], jp.offset);
                            } else {
                                if (added[oldIndex + added.length - removed.length] === undefined) {
                                    debugger
                                }
                                state.jumpPoints[state.jumpPoints.indexOf(jp)] = new JumpPoint(added[oldIndex + added.length - removed.length], jp.offset);
                            }
                        }

                        for (let jp of jumpPointsToRemove) {
                            state.jumpPoints.splice(state.jumpPoints.indexOf(jp), 1)
                        }
                    } else {
                        console.log("removed")
                        for (let currentJumpPoint of state.jumpPoints) {
                            if (added.includes(currentJumpPoint.target) || !removed.includes(currentJumpPoint.target)) {
                                continue
                            }

                            let ind = removed.indexOf(currentJumpPoint.target)
                            if (ind === -1) debugger

                            state.jumpPoints[state.jumpPoints.indexOf(currentJumpPoint)] = new JumpPoint(added[ind], currentJumpPoint.offset);

                        }
                    }

                    console.log("jump points changed", state.jumpPoints);
                }
            }
        }
    )

    mutationObserver.observe(element, {childList: true});

    document.addEventListener('scroll', () => updatePositionCompletionList(element));
    document.addEventListener('resize', () => updatePositionCompletionList(element));
    document.addEventListener('click', () => updatePositionCompletionList(element));
}

console.log("autocomplete enabled.")