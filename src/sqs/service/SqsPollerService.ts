import * as AWS from 'aws-sdk';
import * as SqsConsumer from 'sqs-consumer';
import { Logger } from 'channelape-logger';

import { SqsMessageHandler } from './model/SqsMessageHandler';
import SqsPollerOptions from './model/SqsPollerOptions';

enum MESSAGE_STATUS {
  RECEIVED = 'received',
  PROCESSED = 'processed'
}

enum POLLING_EVENTS {
  ERROR = 'error',
  PROCESSING_ERROR = 'processing_error',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_PROCESSED = 'message_processed',
  EMPTY_QUEUE = 'empty'
}

export default class SqsPollerService {
  private readonly poller: SqsConsumer;
  private readonly sqs: AWS.SQS;
  private readonly logger: Logger;
  private readonly awsSqsQueueUrl: string;

  constructor(options: SqsPollerOptions) {
    this.awsSqsQueueUrl = options.awsSqsQueueUrl;
    this.poller = this.createPoller(options.messageHandler);
    this.addEventHandlers();
    this.sqs = new AWS.SQS({
      accessKeyId: options.awsAccessKeyId,
      secretAccessKey: options.awsSecretAccessKey,
      region: options.awsRegion
    });
    this.logger = new Logger('SqsPoller', options.logLevel);
  }

  public start(): void {
    this.poller.start();
  }

  private createPoller(messageHandler: SqsMessageHandler): SqsConsumer {
    return SqsConsumer.create({
      queueUrl: this.awsSqsQueueUrl,
      handleMessage: messageHandler,
      sqs: this.sqs
    });
  }

  private addEventHandlers(): void {
    this.poller.on(POLLING_EVENTS.ERROR,
      (error: Error, message: AWS.SQS.Message) => this.logMessageError(error, message));

    this.poller.on(POLLING_EVENTS.PROCESSING_ERROR,
      (error: Error, message: AWS.SQS.Message) => this.logMessageError(error, message));

    this.poller.on(POLLING_EVENTS.MESSAGE_RECEIVED,
      (message: AWS.SQS.Message) => this.logMessageStatus(message, MESSAGE_STATUS.RECEIVED));

    this.poller.on(POLLING_EVENTS.MESSAGE_PROCESSED,
      (message: AWS.SQS.Message) => this.logMessageStatus(message, MESSAGE_STATUS.PROCESSED));

    this.poller.on(POLLING_EVENTS.EMPTY_QUEUE,
      () => this.logNoMessages());
  }

  private logMessageError(error: Error, message?: AWS.SQS.Message): void {
    let log = error.message;
    if (message) {
      log = `MessageID ${message.MessageId}: ${error.message}`;
    }
    this.logger.error(log);
  }

  private logMessageStatus(message: AWS.SQS.Message, status: MESSAGE_STATUS): void {
    this.logger.info(`Message with ID of: ${message.MessageId} ${status}`);
  }

  private logNoMessages(): void {
    this.logger.debug(`${this.awsSqsQueueUrl} is empty.`);
  }
}
