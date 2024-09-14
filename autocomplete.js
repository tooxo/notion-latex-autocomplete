let completionsDiv = document.createElement("div")
completionsDiv.id = "completions";

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
    setTimeout(
        findOverlayContainer,
        100
    )
}

findOverlayContainer()

function callback(mutationList, observer) {
    for (let mutation of mutationList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            console.log('A child node has been added:', mutation.addedNodes);
            // You can also access the added nodes like this:
            mutation.addedNodes.forEach(node => {
                console.log('Added node:', node);

                let elements = node.querySelectorAll('div[role="dialog"] > div > .notranslate');
                if (elements.length > 0) {
                    let element = elements[0];
                    state.jumpPoints = []
                    addCallbacks(element);
                    updateCompletionList(element);
                }
            });
        }
    }
}

function updatePositionCompletionList(target) {
    let selection = window.getSelection();
    if (selection !== null) {
        if (selection.focusNode instanceof Text) {
            target = selection.focusNode.parentNode;
        } else {
            target = selection.focusNode;
        }
    } else {
        console.log("selection was zero!");
        debugger;
    }

    if (target === null || target === undefined) {
        if (state.active)
            debugger;
        else
            return;
    }

    completionsDiv.style.top = target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px";
    completionsDiv.style.left = target.getBoundingClientRect().left + "px";
}

function getCursorPosition() {
    function jump(elem) {
        if (!elem.parentNode.matches("div.notranslate")) {
            elem = elem.parentNode;
        }
        return elem;
    }

    let selection = window.getSelection();
    if (!(selection.focusNode instanceof Text)) {
        if (selection.focusNode === null || selection.focusNode === undefined) debugger
        if (selection.focusNode.matches("div.notranslate")) return 0
    }
    let nd = jump(selection.focusNode).previousSibling;

    let prev = 0;
    while (nd != null) {
        if (nd instanceof Text) {
            prev += nd.nodeValue.length;
        } else {
            prev += nd.innerText.length
        }
        nd = nd.previousSibling;
    }

    let pos = prev + selection.focusOffset;

    console.log("pos=" + pos)

    return pos;
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
    // here we set the pos
    let pos = findElementBeforePosition(target, position);
    let child = pos[0]
    let offs = pos[1]

    let selection = window.getSelection();
    let range = selection.getRangeAt(0)

    if (offs !== 0) {
        console.log("setting to ", child, "plus", position);

        if (child instanceof Text || true) {
            range.setStart(child, position);
        } else {
            console.assert(child.childNodes.length === 1);
            range.setStart(child.childNodes[0], position);
        }
    } else {
        console.log("setting after", child);
        setCursorPositionAfter(child);
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

    lowPriorityCurrent.sort((a, b) => a.length - b.length)
    state.currentlyFittingCompletions.push(lowPriorityCurrent)
    state.currentlyFittingCompletions = state.currentlyFittingCompletions.flat()

    console.log(previousSelection)
    if (previousSelection !== undefined && state.currentlyFittingCompletions.slice(0, 5).includes(previousSelection)) {
        state.currentlySelected = state.currentlyFittingCompletions.indexOf(previousSelection)
    } else {
        state.currentlySelected = 0
    }

    console.log("currentlySelected=", state.currentlySelected)
    console.log(state.currentlyFittingCompletions)

    for (let i = 0; i < Math.min(5, state.currentlyFittingCompletions.length); i++) {
        let p_elem = document.createElement("p")

        let span_elem = document.createElement("span");
        span_elem.classList.add("name");

        if (katex !== undefined) {
            katex.render(
                "\\" + state.currentlyFittingCompletions[i].replaceAll("$$", ""), p_elem, {
                    throwOnError: true
                }
            );
        } else {
            console.log("katex is undefined!")
        }
        p_elem.appendChild(span_elem);

        span_elem.innerHTML = state.currentlyFittingCompletions[i].replaceAll("$$", "")

        if (i === state.currentlySelected) {
            p_elem.classList.add("selected")
        }
        completionsDiv.appendChild(p_elem)
    }

    if (state.currentlyFittingCompletions.length === 0) {
        completionsDiv.style.display = "none"
    } else {
        completionsDiv.style.display = "block"
    }

    if (updateLocation)
        updatePositionCompletionList(target)
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

    target.innerText = left.substring(0, left.length - state.partial.length) + selectedElement.replaceAll("$$", "") + right
    target.dispatchEvent(new InputEvent("input", {bubbles: true}))

    let newJumpPoints = []
    for (let jumpPoint of jumpPoints) {
        let p = findElementBeforePosition(target, jumpPoint);
        newJumpPoints.push(p[0])
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
    setCursorPositionAfter(jp)

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

    element.addEventListener('input', (e) => {
        updateCompletionList(e.target)
    })

    element.addEventListener('blur', (e) => {
        completionsDiv.style.display = "none";
        state = new AutoCompleteState();
        console.log("blur", e)
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

                        console.log("bb1", added.length - removed.length, added, removed)

                        for (; i < Math.min(removed.length); i++) {
                            if (added[i] === undefined) return

                            if (added[i].innerText !== removed[i].innerText) {
                                break
                            }
                        }

                        let jumpPointsToRemove = [];
                        for (let jp of state.jumpPoints) {
                            if (added.includes(jp) || Array.from(element.childNodes).includes(jp)) {
                                continue;
                            }

                            let oldIndex = removed.indexOf(jp);
                            if (oldIndex === -1) {
                                jumpPointsToRemove.push(jp)
                                continue
                            }

                            if (oldIndex < i) {
                                state.jumpPoints[state.jumpPoints.indexOf(jp)] = added[oldIndex];
                            } else {
                                if (added[oldIndex + added.length - removed.length] === undefined) {
                                    debugger
                                }
                                state.jumpPoints[state.jumpPoints.indexOf(jp)] = added[oldIndex + added.length - removed.length];
                            }
                        }

                        for (let jp of jumpPointsToRemove) {
                            state.jumpPoints.splice(state.jumpPoints.indexOf(jp), 1)
                        }
                    } else {
                        console.log("removed")
                        for (let currentJumpPoint of state.jumpPoints) {
                            if (added.includes(currentJumpPoint) || !removed.includes(currentJumpPoint)) {
                                continue
                            }

                            let ind = removed.indexOf(currentJumpPoint)
                            if (ind === -1) debugger

                            state.jumpPoints[state.jumpPoints.indexOf(currentJumpPoint)] = added[ind];

                            console.log("child", added.includes(currentJumpPoint))
                        }
                    }
                }
            }
        }
    )

    mutationObserver.observe(element, {childList: true});

    document.addEventListener('scroll', () => updatePositionCompletionList(element));
    document.addEventListener('resize', () => updatePositionCompletionList(element));
    document.addEventListener('click', () => updatePositionCompletionList(element));
}