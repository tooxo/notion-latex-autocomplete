"use strict"

export class Message<T> {
    type = "notion-latex-message";
    id: string;
    body: T;

    constructor(id: string, body: T) {
        this.id = id;
        this.body = body;
    }
}

export class Box {
    height: number;
    width: number;

    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
    }
}

export class EntryBody {
    key: string;
    value: Box;

    constructor(key: string, value: Box) {
        this.key = key;
        this.value = value;
    }
}

export class StoreMessage extends Message<EntryBody> {
    type = "notion-latex-message-store";
}

export class StoreResponse extends Message<null> {
    type = "notion-latex-message-store-response";
}

export class QueryMessage extends Message<string> {
    type = "notion-latex-message-query";
}

export class QueryResponse extends Message<Box | null> {
    type = "notion-latex-message-query-response";
}

export class MessageBroker {
    pending = new Map<string, (value: Message<unknown>) => void>();

    constructor(requestHandler: (request: Message<unknown>) => Promise<Message<unknown> | null>) {
        this.__handleResponses();
        this.__handleIncomingMessages(requestHandler);
    }

    query<Q, R>(body: Message<Q>): Promise<Message<unknown>> {
        return new Promise((resolve: (value: Message<R>) => void, _reject) => {
            this.pending.set(body.id, resolve as (value: Message<unknown>) => void);
            window.postMessage(
                body
            )
        });
    }

    private __handleResponses() {
        this.__handleIncomingMessages((message): Promise<null> => {
            if (!message.type.endsWith("response")) return Promise.resolve(null);

            if (this.pending.has(message.id)) {
                this.pending.get(message.id)!(message);
                this.pending.delete(message.id);
            }

            return Promise.resolve(null);
        })
    }

    private __handleIncomingMessages(callback: (message: Message<unknown>) => Promise<Message<unknown> | null>) {
        window.addEventListener(
            "message", (message: MessageEvent) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const data: { type: string | undefined } = message.data ?? {} as { type: string | undefined };

                if (!(data.type)) return // not for us
                if (!data.type.startsWith("notion-latex-message")) return;

                callback(data as Message<unknown>)
                    .then(
                        (possibleResponse) => {
                            if (possibleResponse) {
                                window.postMessage(
                                    possibleResponse
                                )
                            }
                        }
                    ).catch(console.error);
            }
        )
    }
}
