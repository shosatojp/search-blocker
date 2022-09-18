// export type MessageContent = object;

export interface Message {
    id: number
    tag: string
    content: any
    reply: boolean
    sender: string
}

export interface PendingMessage {
    resolve: (content: any) => void
    reject: (content: any) => void
    message: Message
}

export class Messenger {
    applicationTag: string;
    senderTag: string;
    messageId: number;
    messagesPending: Map<number, PendingMessage> = new Map();

    constructor(application_tag: string, sender_tag: string,
        onMessage: (content: any) => Promise<any>) {

        this.applicationTag = application_tag;
        this.senderTag = sender_tag;
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

    post(content: any) {
        return new Promise((resolve, reject) => {
            const mid = this.messageId++;
            const message: Message = {
                id: mid,
                tag: this.applicationTag,
                content: content,
                reply: false,
                sender: this.senderTag,
            };
            window.postMessage(message);
            this.messagesPending.set(mid, { resolve, reject, message });
        });
    }
}
