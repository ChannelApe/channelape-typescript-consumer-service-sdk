import { SQS } from 'aws-sdk';

export type SqsMessageHandler = (message: SQS.Message, done: Function) => void;
