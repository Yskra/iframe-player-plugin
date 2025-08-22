export interface Player {
    (sendMessage: SendMessage, onReceiveMessage: OnReceiveMessage): Promise<void>;
}

interface SendMessage {
    (command: string, data: any): void;
}

interface OnReceiveMessage {
    (handler: (command: string, args: any) => void): void;
}
