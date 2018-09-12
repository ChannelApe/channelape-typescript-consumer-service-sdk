import { expect } from 'chai';
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';
import * as SqsConsumer from 'sqs-consumer';
import { Logger, LogLevel } from 'channelape-logger';
import { EventEmitter } from 'events';

import SqsPollerService from '../../../src/sqs/service/SqsPollerService';
import SqsPollerOptions from '../../../src/sqs/service/model/SqsPollerOptions';

const sandbox = sinon.createSandbox();
let sqsConsumerCreateStub: sinon.SinonStub;
let pollerStartStub: sinon.SinonStub;
let emitter: EventEmitter;
let infoLogSpy: sinon.SinonSpy;
let errorLogSpy: sinon.SinonSpy;
let debugLogSpy: sinon.SinonSpy;
let sqsPoller: SqsPollerService;

const fakeMessage: AWS.SQS.Types.ReceiveMessageResult = {
  Messages: [{
    Body: 'Message in a bottle.',
    MessageId: '170117011701'
  }]
};

const pollerOptions: SqsPollerOptions = {
  awsAccessKeyId: '',
  awsRegion: '',
  awsSecretAccessKey: '',
  awsSqsQueueUrl: 'some-queue-url',
  logLevel: LogLevel.INFO,
  messageHandler: () => { }
};

describe('SqsPollerService', () => {
  beforeEach(() => {
    infoLogSpy = sandbox.spy(Logger.prototype, 'info');
    errorLogSpy = sandbox.spy(Logger.prototype, 'error');
    debugLogSpy = sandbox.spy(Logger.prototype, 'debug');
    emitter = new EventEmitter();
    pollerStartStub = sandbox.stub(SqsConsumer.prototype, 'start');
    sqsConsumerCreateStub = sandbox.stub(SqsConsumer, 'create')
      .callsFake((params) => {
        params.handleMessage(fakeMessage!.Messages![0], () => {});
        return emitter;
      });
    sqsPoller = new SqsPollerService(pollerOptions);
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('start()', () => {
    it('Should start the poller', () => {
      sqsConsumerCreateStub.restore();
      sqsPoller = new SqsPollerService(pollerOptions);
      sqsPoller.start();
      expect(pollerStartStub.calledOnce).to.be.true;
    });
  });

  context('once started', () => {
    describe('Given a message on the queue', () => {
      it('Should retrieve it and respond', (doneWithTest) => {
        new SqsPollerService({
          messageHandler: handler,
          awsAccessKeyId: '',
          awsRegion: '',
          awsSecretAccessKey: '',
          awsSqsQueueUrl: 'some-queue-url',
          logLevel: LogLevel.INFO
        });

        function handler(message: AWS.SQS.Message, done: Function) {
          expect(message.Body).to.equal('Message in a bottle.');
          done();
          doneWithTest();
        }
      });
    });

    describe('error event emitted', () => {
      it('should log the error', () => {
        emitter.emit('error', new Error('Error!'));
        expect(errorLogSpy.calledOnce).to.be.true;
      });
    });

    describe('processing_error event emitted', () => {
      it('should log the processing_error', () => {
        emitter.emit('processing_error', new Error('Error!'), { MessageId: '1701' });
        expect(errorLogSpy.calledOnce).to.be.true;
        expect(errorLogSpy.args[0][0]).to.equal('MessageID 1701: Error!');
      });
    });

    describe('empty event emitted', () => {
      it('should log that the queue is empty', () => {
        emitter.emit('empty');
        expect(debugLogSpy.calledOnce).to.be.true;
        expect(debugLogSpy.args[0][0]).to.equal('some-queue-url is empty.');
      });
    });

    describe('message_received event emitted', () => {
      it('should log that a message was received', () => {
        emitter.emit('message_received', { MessageId: '1701' });
        expect(infoLogSpy.calledOnce).to.be.true;
        expect(infoLogSpy.args[0][0]).to.equal(`Message with ID of: 1701 received`);
      });
    });

    describe('message_processed event emitted', () => {
      it('should log that a message was processed', () => {
        emitter.emit('message_processed', { MessageId: '1701' });
        expect(infoLogSpy.calledOnce).to.be.true;
        expect(infoLogSpy.args[0][0]).to.equal(`Message with ID of: 1701 processed`);
      });
    });
  });
});
