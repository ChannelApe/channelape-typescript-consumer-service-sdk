import { LogLevel } from 'channelape-logger';

import { SqsMessageHandler } from './SqsMessageHandler';

export default interface SqsPollerOptions {
  messageHandler: SqsMessageHandler;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsSqsQueueUrl: string;
  logLevel: LogLevel;
}
