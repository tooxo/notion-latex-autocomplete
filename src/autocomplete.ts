import {all_flattened, delimiter_sizing} from "./constants";
import {printPrettier} from "prettier-plugin-latex/standalone";
import katex from "katex";

let debug = false;

let completionsDiv = document.createElement("div")
completionsDiv.id = "completions";

let completion_ranking = new Map()
for (let possibility of all_flattened) {
    completion_ranking.set(possibility, 0)
}

class JumpPoint {
    constructor(target: Node, offset: number) {
        this.target = target;
        this.offset = offset;
    }

    target: Node;
    offset: number;
}

class AutoCompleteState {
    active = false;
    allCompletions = all_flattened

    partial = ""
    currentlyFittingCompletions: string[] = []
    currentlySelected = 0

    jumpPoints: JumpPoint[] = []

    lastCompletions: string[] = []
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


function callback(mutationList: MutationRecord[], _observer: MutationObserver) {
    for (let mutation of mutationList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            console.log('A child node has been added:', mutation.addedNodes);

            mutation.addedNodes.forEach(node => {
                let elements = (<Element>node).querySelectorAll('div[role="dialog"] > div > .notranslate');
                if (elements.length > 0) {
                    console.log('Added node:', node);

                    let element = <HTMLElement>elements[0];
                    state.jumpPoints = []
                    addCallbacks(element);
                    updateCompletionList(element);
                }
            });
        }
        if (!debug) if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
            console.log('A child node has been removed:', mutation.removedNodes);
            mutation.removedNodes.forEach(node => {
                let elements = (<Element>node).querySelectorAll('div[role="dialog"] > div > .notranslate');
                if (elements.length > 0) {
                    completionsDiv.style.display = 'none';
                    state = new AutoCompleteState();
                }
            })
        }
    }
}

function updatePositionCompletionList() {
    console.log("update position completionList");
    let target: Element | null;
    let selection = window.getSelection();
    if (selection === null || selection.focusNode === null) {
        debugger;
        return;
    }

    let fn = selection.focusNode;
    if (fn instanceof Text) {
        // if there is a "temp" node for rendering, we skip it
        if (!fn.nodeValue!.startsWith("\\")) {
            target = <Element | null>fn.previousSibling;
        } else {
            target = <Element | null>fn.parentNode;
        }
    } else {
        target = <Element | null>fn;
    }
    if (target === null) {
        if (state.active) debugger;
        return;
    }

    console.log("update position", selection.focusNode, target, target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px", target.getBoundingClientRect().left + "px", target.getBoundingClientRect().height + "px");

    completionsDiv.style.top = target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px";
    completionsDiv.style.left = target.getBoundingClientRect().left + "px";
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

function getCursorPosition() {
    let selection = window.getSelection();
    console.assert(selection !== null);
    return getLengthBefore(selection!.focusNode) + selection!.focusOffset;
}

function findElementBeforePosition(target: Node, position: number) {
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

function setCursorPosition(jp: JumpPoint) {
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

    let offs = jp.offset - getLengthBefore(jp.target);

    let selection = window.getSelection();
    console.assert(selection !== null);
    let range = selection!.getRangeAt(0)

    if (offs !== 0) {
        console.log("setting to ", jp.target, "plus", offs);

        while (jp.target instanceof Element) {
            let current_length = 0;
            for (let child of jp.target.childNodes) {
                if (current_length + elementLength(child) >= offs) {
                    jp.target = child;
                    offs -= current_length;
                    break;
                } else {
                    current_length += elementLength(child);
                }
            }
        }

        console.log("setting to ", jp.target, "plus", offs);
        range.setStart(jp.target, offs);
    } else {
        console.log("setting after", jp.target);
        setCursorPositionAfter(jp.target);
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

function boolean_to_number(b: boolean | null) {
    return b ? 1 : 0;
}

function sort_value(ref: string, x: string) {
    return (boolean_to_number(x.startsWith(ref)) + 0.5) * (completion_ranking.get(x) + 1)
}

function updateCompletionList(target: HTMLElement, updateLocation = true) {
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

    let lowPriorityCurrent: string[] = []
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

        let katexString = state.currentlyFittingCompletions[i];
        let alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        while (katexString.includes("$$")) {
            katexString = katexString.replace("$$", alphabet.shift()!);
        }
        if (delimiter_sizing.includes(katexString)) {
            katexString += "["
        }

        try {
            katex.render("\\" + katexString, p_elem, {
                throwOnError: true
            });

            let katex_elem = p_elem.getElementsByClassName("katex").item(0)!;
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

    if (updateLocation) updatePositionCompletionList()
}


function acceptAutocompletion(target: HTMLElement) {
    let value = target.innerText;

    let currentPos = getCursorPosition();

    let left = value.substring(0, currentPos)
    let right = value.substring(currentPos, value.length)

    let selectedElement = state.currentlyFittingCompletions[state.currentlySelected];

    let jumpPoints: number[] = []
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
        newJumpPoints.push(new JumpPoint(p, jumpPoint));
    }

    state.jumpPoints = newJumpPoints.concat(state.jumpPoints)
    console.log("cjp", state.jumpPoints)
    completionsDiv.style.display = "none"

    console.assert(jumpToNextJumpPoint())

    state.active = false
}

function jumpToNextJumpPoint() {
    if (state.jumpPoints.length === 0) {
        return false;
    }

    let jp = state.jumpPoints.shift()!;
    console.log("jumping to", jp)
    setCursorPosition(jp);

    return true;
}

function addCallbacks(element: HTMLElement) {
    let autoFormatEnabled = true;
    element.addEventListener('keydown', (_e: Event) => {
        let e = <KeyboardEvent>_e;
        let eventTarget = <HTMLElement>_e.target!;
        autoFormatEnabled = autoFormatEnabled || e.key !== "k";
        switch (e.key) {
            case '\\':
                state.active = true
                console.log("+ complete active")
                break
            case "Escape":
                state.jumpPoints = []

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
                    acceptAutocompletion(eventTarget)
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
                updateCompletionList(eventTarget, false)
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
                updateCompletionList(eventTarget, false)
                break
            case 'k':
                if (e.altKey && e.ctrlKey && !e.shiftKey && autoFormatEnabled) {
                    console.log(element.innerText);
                    (async () => {
                            let response = await printPrettier(
                                element.innerText,
                                {
                                    tabWidth: 2,
                                    useTabs: false,
                                    printWidth: 40
                                }
                            );
                            console.log(element.innerText, response);
                            element.innerText = response;
                            element.dispatchEvent(new InputEvent("input", {bubbles: true}));

                            return response;
                        }
                    )();
                    autoFormatEnabled = false;
                    e.preventDefault();
                }
                break
        }
    })

    function _length_difference(new_data: string, old_data: string) {
        return new_data.length - old_data.length;
    }

    let _last_input: string | null = null
    element.addEventListener('input', (e) => {
        updateCompletionList(<HTMLElement>e.target!);

        let cursor_position = getCursorPosition();

        if (_last_input !== null) {
            let _l_diff = _length_difference((<HTMLElement>e.target!).innerText, _last_input);

            if (_l_diff !== 0) {
                state.jumpPoints = state.jumpPoints.map((v) => {
                    if (v.offset >= cursor_position) {
                        return new JumpPoint(v.target, v.offset += _l_diff);
                    }
                    return v
                })
            }
        }
        _last_input = (<HTMLElement>e.target!).innerText;
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

    // noinspection JSMismatchedCollectionQueryUpdate
    let parkingLot: HTMLElement[];
    let mutationObserver = new MutationObserver((mutations, _observer) => {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    let added = <HTMLElement[]>Array.from(mutation.addedNodes);
                    let removed = <HTMLElement[]>Array.from(mutation.removedNodes);

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
                            if ((<Node[]>added).includes(jp.target) || (<Node[]>Array.from(element.childNodes)).includes(jp.target)) {
                                continue;
                            }

                            let oldIndex = (<Node[]>removed).indexOf(jp.target);
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
                            if ((<Node[]>added).includes(currentJumpPoint.target) || !(<Node[]>removed).includes(currentJumpPoint.target)) {
                                continue
                            }

                            let ind = (<Node[]>removed).indexOf(currentJumpPoint.target)
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

    document.addEventListener('scroll', () => updatePositionCompletionList());
    document.addEventListener('resize', () => updatePositionCompletionList());
    document.addEventListener('click', () => updatePositionCompletionList());
}

console.log("autocomplete enabled.")