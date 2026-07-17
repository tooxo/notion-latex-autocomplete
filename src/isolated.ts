import * as browser from "webextension-polyfill"
import {Box, Message, MessageBroker, QueryMessage, QueryResponse, StoreMessage, StoreResponse} from "./message";

async function store(storage_tag: string, box: Box) {
    return await new Promise((
        resolve, reject
    ) => {
        browser.storage.local.set(
            {[storage_tag]: box}
        ).then(
            resolve,
            reject
        );
    })
}

async function restore(storage_tag: string) {
    return await new Promise((resolve: (box: Box) => void, reject) => {
        browser.storage.local.get(storage_tag).then((value) => {
            const box: Box = value[storage_tag] as Box;
            return resolve(box);
        }, reject)
    })
}

async function handleIncomingMessage(message: Message<unknown>): Promise<Message<unknown> | null> {
    switch (message.type) {
        case "notion-latex-message-store": {
            const m = message as StoreMessage;
            await store(
                m.body.key,
                m.body.value
            );

            return new StoreResponse(m.id, null);
        }
        case "notion-latex-message-query": {
            const m = message as QueryMessage;

            const value = await restore(m.body);
            return new QueryResponse(m.id, value);
        }
        default: {
            return null;
        }
    }
}

new MessageBroker(handleIncomingMessage);
console.log("started isolated!")