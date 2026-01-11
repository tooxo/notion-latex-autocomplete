"use strict"
import {all_flattened, color, delimiter_sizing} from "./constants";
import {findElementBeforePosition, getCursorPosition, setCursorPosition, sort_value} from "./contextless"
// @ts-expect-error aaa
import {printPrettier} from "prettier-plugin-latex/standalone";
import katex from "katex";

class JumpPoint {
    target: Node;
    offset: number;

    constructor(target: Node, offset: number) {
        this.target = target;
        this.offset = offset;
    }
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

class AttachedEquationField {
    state: AutoCompleteState = new AutoCompleteState();

    attachee: HTMLElement;
    completionsDiv: HTMLDivElement;

    close() {
        this.completionsDiv.style.display = "none";
        this.state = new AutoCompleteState();
    }

    constructor(element: HTMLElement) {
        this.completionsDiv = document.createElement("div")
        this.completionsDiv.id = "completions";

        this.attachee = element;
        this.addCallbacks();
        this.updateCompletionList();
    }

    autoFormatEnabled: boolean = true;

    keyDownEvent(e: KeyboardEvent) {
        const eventTarget = e.target! as HTMLElement;
        this.autoFormatEnabled = this.autoFormatEnabled || e.key !== "k";

        switch (e.key) {
            case '\\':
                this.state.active = true
                console.log("+ complete active")
                break
            case "Escape":
                this.state.jumpPoints = []

            // noinspection FallThroughInSwitchStatementJS
            case " ":
                this.state.active = false
                console.log("- complete inactive")

                this.completionsDiv.style.display = "none"
                break
            case "Tab":
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (!this.state.active && this.state.jumpPoints.length > 0) {
                    this.jumpToNextJumpPoint()
                } else if (this.state.active) {
                    if (this.state.currentlyFittingCompletions.length === 0 || !this.state.active) {
                        return
                    }
                    this.acceptAutocompletion(eventTarget)
                } else {
                    console.log("not active and no jumpp")
                    break
                }
                break
            case "ArrowDown":
                if (!this.state.active) {
                    return;
                }

                e.preventDefault()
                this.state.currentlySelected++;
                this.updateCompletionList(false)
                break
            case "ArrowUp":
                if (!this.state.active) {
                    return;
                }

                e.preventDefault()
                this.state.currentlySelected--;
                if (this.state.currentlySelected < 0) {
                    this.state.currentlySelected = Math.min(4, this.state.currentlyFittingCompletions.length - 1)
                }
                this.updateCompletionList(false)
                break
            case 'k':
                if (e.altKey && e.ctrlKey && !e.shiftKey && this.autoFormatEnabled) {
                    console.log(this.attachee.innerText);

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    printPrettier(
                        this.attachee.innerText,
                        {
                            tabWidth: 2,
                            useTabs: false,
                            printWidth: 40
                        }
                    )

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        .then(
                            (response: string) => {
                                console.log(this.attachee.innerText, response);

                                if (this.attachee.innerText !== response) {
                                    this.attachee.innerText = response;
                                    this.attachee.dispatchEvent(new InputEvent("input", {bubbles: true}));
                                }
                            },
                        );

                    this.autoFormatEnabled = false;
                    e.preventDefault();
                }
                break
        }
    }

    _last_input: string | null = null;

    inputEvent(e: InputEvent) {
        this.updateCompletionList();

        const cursor_position = getCursorPosition();

        if (this._last_input !== null) {
            const _l_diff = (e.target! as HTMLElement).innerText.length - this._last_input.length;

            if (_l_diff !== 0) {
                this.state.jumpPoints = this.state.jumpPoints.map((v) => {
                    if (v.offset >= cursor_position) {
                        return new JumpPoint(v.target, v.offset += _l_diff);
                    }
                    return v
                })
            }
        }
        this._last_input = (e.target! as HTMLElement).innerText;
    }

    parkingLot: HTMLElement[] = [];

    addMutationObserver() {
        const mutationObserver = new MutationObserver(
            (mutations, _) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        const added = Array.from(mutation.addedNodes) as HTMLElement[];
                        let removed = Array.from(mutation.removedNodes) as HTMLElement[];

                        if (added.length > 0) {
                            if (added[added.length - 1].innerText === "") {
                                console.log("child (add temp skip)")
                                this.parkingLot = removed
                                continue;
                            }
                        }
                        if (removed.length > 0) {
                            if (removed[removed.length - 1].innerText === "") {
                                console.log("child (rem temp skip)")
                                removed = this.parkingLot
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

                            const jumpPointsToRemove = [];

                            for (const jp of this.state.jumpPoints) {
                                if ((added as Node[]).includes(jp.target) || (Array.from(this.attachee.childNodes) as Node[]).includes(jp.target)) {
                                    continue;
                                }

                                const oldIndex = (removed as Node[]).indexOf(jp.target);
                                if (oldIndex === -1) {
                                    jumpPointsToRemove.push(jp)
                                    continue
                                }

                                if (oldIndex < i) {
                                    this.state.jumpPoints[this.state.jumpPoints.indexOf(jp)] = new JumpPoint(added[oldIndex], jp.offset);
                                } else {
                                    if (added[oldIndex + added.length - removed.length] === undefined) {
                                        debugger
                                    }
                                    this.state.jumpPoints[this.state.jumpPoints.indexOf(jp)] = new JumpPoint(added[oldIndex + added.length - removed.length], jp.offset);
                                }
                            }

                            for (const jp of jumpPointsToRemove) {
                                this.state.jumpPoints.splice(this.state.jumpPoints.indexOf(jp), 1)
                            }
                        } else {
                            console.log("removed")
                            for (const currentJumpPoint of this.state.jumpPoints) {
                                if ((added as Node[]).includes(currentJumpPoint.target) || !(removed as Node[]).includes(currentJumpPoint.target)) {
                                    continue
                                }

                                const ind = (removed as Node[]).indexOf(currentJumpPoint.target)
                                if (ind === -1) debugger

                                this.state.jumpPoints[this.state.jumpPoints.indexOf(currentJumpPoint)] = new JumpPoint(added[ind], currentJumpPoint.offset);

                            }
                        }

                        console.log("jump points changed", this.state.jumpPoints);
                    }
                }

                // reintroduce the cursors
                for (const jumpPoint of this.state.jumpPoints) {
                    if (jumpPoint.target instanceof HTMLElement) {
                        jumpPoint.target.classList.add("auto-completion-jump-cursor");
                    }
                }
            }
        )

        mutationObserver.observe(this.attachee, {childList: true});
    }

    addCallbacks() {
        const element = this.attachee;
        element.addEventListener('keydown', (e: Event) => this.keyDownEvent((e as KeyboardEvent)));

        element.addEventListener('input', (e) => this.inputEvent((e as InputEvent)));

        element.addEventListener('blur', (_ignored) => {
            if (!debug) {
                this.close()
            }
        })

        element.addEventListener('focusout', (_ignored) => {
            console.log("focusout!")
        })

        document.addEventListener('scroll', () => this.updatePositionCompletionList());
        document.addEventListener('resize', () => this.updatePositionCompletionList());
        document.addEventListener('click', () => this.updatePositionCompletionList());

        this.addMutationObserver();
    }

    updateCompletionList(updateLocation = true) {
        const target = this.attachee;

        const previousSelection = this.state.currentlyFittingCompletions[this.state.currentlySelected]

        this.state.currentlyFittingCompletions = []
        this.completionsDiv.innerHTML = ''

        if (!this.state.active) {
            return;
        }

        const val = target.innerText

        const cursor = getCursorPosition();
        const subString = val.substring(0, cursor)
        if (!subString.includes("\\")) {
            return
        }
        const l = subString.split("\\")
        this.state.partial = l[l.length - 1]

        if (this.state.partial.includes(" ")) {
            return;
        }

        console.log("partial=", this.state.partial);
        if (this.state.partial.length === 0) {
            return
        }

        for (const lastSelectionElement of this.state.lastCompletions) {
            if (lastSelectionElement.replaceAll("$$", "").includes(this.state.partial)) {
                this.state.currentlyFittingCompletions.push(lastSelectionElement)
            }
        }

        const lowPriorityCurrent: string[] = []
        for (const completion of this.state.allCompletions) {
            if (completion.replaceAll("$$", "").includes(this.state.partial) && !lowPriorityCurrent.includes(completion) && !this.state.currentlyFittingCompletions.includes(completion)) {
                lowPriorityCurrent.push(completion)
            }
        }

        if (lowPriorityCurrent.length < 5) {
            for (const completion of this.state.allCompletions) {
                if (completion.toLowerCase().replaceAll("$$", "").includes(this.state.partial.toLowerCase()) && !lowPriorityCurrent.includes(completion) && !this.state.currentlyFittingCompletions.includes(completion)) {
                    lowPriorityCurrent.push(completion)
                }
            }
        }

        lowPriorityCurrent.sort((a, b) => sort_value(this.state.partial, b, completion_ranking) - sort_value(this.state.partial, a, completion_ranking));
        this.state.currentlyFittingCompletions.push(...lowPriorityCurrent)
        this.state.currentlyFittingCompletions = this.state.currentlyFittingCompletions.flat()

        if (previousSelection !== undefined && this.state.currentlyFittingCompletions.slice(0, 5).includes(previousSelection)) {
            this.state.currentlySelected = this.state.currentlyFittingCompletions.indexOf(previousSelection)
        } else {
            this.state.currentlySelected = 0
        }

        console.log("currentlySelected=", this.state.currentlySelected)
        console.log(this.state.currentlyFittingCompletions)

        for (let i = 0; i < Math.min(5, this.state.currentlyFittingCompletions.length); i++) {
            const p_elem = document.createElement("p")
            this.completionsDiv.appendChild(p_elem)

            p_elem.hidden = true;

            const span_elem = document.createElement("span");
            span_elem.classList.add("name");

            let katexString = this.state.currentlyFittingCompletions[i];
            const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
            const colours = ["#ecec93", "#eb5757", "#ecec93"];
            let numberOfInserts = katexString.split("$$").length - 1;
            while (katexString.includes("$$")) {
                let replacement;
                if (numberOfInserts !== 1 && color.includes(this.state.currentlyFittingCompletions[i])) {
                    replacement = colours.shift()!;
                } else {
                    replacement = alphabet.shift()!;
                }

                katexString = katexString.replace("$$", replacement);
                numberOfInserts--;
            }
            if (delimiter_sizing.includes(katexString)) {
                katexString += "["
            }

            try {
                katex.render("\\" + katexString, p_elem, {
                    throwOnError: true
                });

                const katex_elem = p_elem.getElementsByClassName("katex").item(0)!;
                const wanted_height = katex_elem.scrollHeight;
                const height = katex_elem.getBoundingClientRect().height;

                // prevent overflow by scaling down
                if (Math.abs(wanted_height - height) > 1) {
                    // too far apart, scale

                    const scale = height / wanted_height;
                    katex_elem.setAttribute("style", "transform: scale(" + scale + ");");
                }
            } catch (err) {
                console.log("error while rendering", err);
                p_elem.appendChild(document.createElement("span"));
            }

            p_elem.appendChild(span_elem);

            span_elem.innerHTML = this.state.currentlyFittingCompletions[i].replaceAll("$$", "")

            if (i === this.state.currentlySelected) {
                p_elem.classList.add("selected")
            }

            p_elem.hidden = false;
        }

        if (this.state.currentlyFittingCompletions.length === 0) {
            this.completionsDiv.style.display = "none"
        } else {
            this.completionsDiv.style.display = "block"
        }

        if (updateLocation) this.updatePositionCompletionList()
    }

    updatePositionCompletionList() {
        console.log("update position completionList");
        let target: Element | null;
        const selection = window.getSelection();
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (selection === null || selection.focusNode === null) {
            debugger;
            return;
        }

        const fn = selection.focusNode;
        if (fn instanceof Text) {
            // if there is a "temp" node for rendering, we skip it
            if (!fn.nodeValue!.startsWith("\\")) {
                target = fn.previousSibling as Element | null;
            } else {
                target = fn.parentNode as Element | null;
            }
        } else {
            target = fn as Element | null;
        }
        if (target === null) {
            if (this.state.active) debugger;
            return;
        }

        console.log("update position", selection.focusNode, target, target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px", target.getBoundingClientRect().left + "px", target.getBoundingClientRect().height + "px");

        this.completionsDiv.style.top = target.getBoundingClientRect().top + target.getBoundingClientRect().height + "px";
        this.completionsDiv.style.left = target.getBoundingClientRect().left + "px";
    }

    jumpToNextJumpPoint() {
        if (this.state.jumpPoints.length === 0) {
            return false;
        }

        const jp = this.state.jumpPoints.shift()!;
        console.log("jumping to", jp)
        setCursorPosition(jp.target, jp.offset);

        if (jp.target instanceof HTMLElement) {
            jp.target.classList.remove("auto-completion-jump-cursor");
        }

        return true;
    }

    acceptAutocompletion(target: HTMLElement) {
        const value = target.innerText;

        const currentPos = getCursorPosition();

        const left = value.substring(0, currentPos)
        const right = value.substring(currentPos, value.length)

        const selectedElement = this.state.currentlyFittingCompletions[this.state.currentlySelected];

        const jumpPoints: number[] = []
        for (const part of selectedElement.split("$$")) {
            if (jumpPoints.length === 0) {
                jumpPoints.push(left.length - this.state.partial.length + part.length)
            } else {
                jumpPoints.push(jumpPoints[jumpPoints.length - 1] + part.length)
            }
        }

        if (!this.state.lastCompletions.includes(selectedElement)) {
            this.state.lastCompletions.push(selectedElement)
        }
        completion_ranking.set(selectedElement, completion_ranking.get(selectedElement)! + 1);

        target.innerText = left.substring(0, left.length - this.state.partial.length) + selectedElement.replaceAll("$$", "") + right;
        target.dispatchEvent(new InputEvent("input", {bubbles: true}));

        const newJumpPoints = []
        for (const jumpPoint of jumpPoints) {
            const p = findElementBeforePosition(target, jumpPoint);
            if (p instanceof HTMLElement) {
                p.classList.add("auto-completion-jump-cursor");
            }

            newJumpPoints.push(new JumpPoint(p, jumpPoint));
        }

        this.state.jumpPoints = newJumpPoints.concat(this.state.jumpPoints)
        console.log("cjp", this.state.jumpPoints)
        this.completionsDiv.style.display = "none"

        console.assert(this.jumpToNextJumpPoint())

        this.state.active = false
    }


}

class DocumentObserver extends MutationObserver {
    overlayContainer: HTMLDivElement | null = null;
    attachedEquationField: AttachedEquationField | null = null;

    constructor() {
        super((mutationList: MutationRecord[], o: MutationObserver) => (o as DocumentObserver).callback(mutationList, o));
    }

    callback(mutationList: MutationRecord[], _: MutationObserver) {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                console.log('A child node has been added:', mutation.addedNodes);

                mutation.addedNodes.forEach(node => {
                    const elements = (node as Element).querySelectorAll('div[role="dialog"] > div > .notranslate');
                    if (elements.length > 0) {
                        console.log('Added node:', node, this);

                        const element = elements[0] as HTMLElement;
                        this.attachedEquationField = new AttachedEquationField(element);

                        this.overlayContainer!.appendChild(this.attachedEquationField.completionsDiv)
                    }
                });
            }
            if (!debug) if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                console.log('A child node has been removed:', mutation.removedNodes);
                mutation.removedNodes.forEach(node => {
                    const elements = (node as Element).querySelectorAll('div[role="dialog"] > div > .notranslate');
                    if (elements.length > 0) {
                        this.attachedEquationField?.close();
                        this.attachedEquationField = null;
                    }
                })
            }
        }
    }

    findOverlayContainer() {
        console.log("observing searching for container!");
        this.overlayContainer = document.querySelector(".notion-overlay-container.notion-default-overlay-container");
        if (this.overlayContainer !== null && this.overlayContainer !== undefined) {
            console.log("observing", this.overlayContainer);
            this.observe(this.overlayContainer, {childList: true})
            return
        }
        setTimeout(() => this.findOverlayContainer(), 1000)
    }
}

const debug = false;

const completion_ranking = new Map<string, number>()
for (const possibility of all_flattened) {
    completion_ranking.set(possibility, 0)
}

const documentObserver = new DocumentObserver();
documentObserver.findOverlayContainer();

console.log("Extension Enabled.");