// export type MessageContent = object;

export interface Message<T> {
    id: number
    tag: string
    content: T
    reply: boolean
    sender: string
}

export interface PendingMessage<T> {
    resolve: (content: T) => void
    reject: (content: T) => void
    message: Message<T>
}

export class Messenger<T, R = unknown> {
    applicationTag: string;
    senderTag: string;
    messageId: number;
    messagesPending: Map<number, PendingMessage<T>> = new Map();

    constructor(applicationTag: string, senderTag: string,
        onMessage: (content: T) => Promise<R>) {
        this.applicationTag = applicationTag;
        this.senderTag = senderTag;
        this.messageId = 0;

        window.addEventListener('message', async (ev) => {
            if (!(ev.data.tag === this.applicationTag &&
                typeof ev.data.id === 'number' &&
                ev.data.sender !== this.senderTag)) {
                return;
            }

            if (ev.data.reply) {
                const id = ev.data.id;
                const pendingMessage = this.messagesPending.get(id);
                if (!pendingMessage) {
                    console.warn('pending message not found');
                    return;
                }
                const { resolve } = pendingMessage;
                resolve(ev.data.content);
            } else {
                const ret = await onMessage(ev.data.content);
                const message = {
                    id: ev.data.id,
                    tag: ev.data.tag,
                    content: ret,
                    reply: true,
                    sender: this.senderTag,
                };
                window.postMessage(message);
            }
        });

        window.addEventListener('messageerror', (ev) => {
            console.warn('messageerror', ev);
        });
    }

    post(content: T) {
        return new Promise((resolve, reject) => {
            const mid = this.messageId++;
            const message: Message<T> = {
                id: mid,
                tag: this.applicationTag,
                content,
                reply: false,
                sender: this.senderTag,
            };
            window.postMessage(message);
            this.messagesPending.set(mid, { resolve, reject, message });
        });
    }
}
