import { expect } from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as AppRootPath from 'app-root-path';
import * as eol from 'eol';
import { S3 } from 'aws-sdk';

import S3Service from '../../../src/s3/service/S3Service';

const csv = eol.lf(fs.readFileSync(`${AppRootPath}/test/resources/service/s3/inventory.csv`, 'utf-8'));

const S3_SUCCESS: S3.ManagedUpload.SendData = {
  ETag: '"06d823feca0a859898acac2a3a7a3f52"',
  Location: 'https://allbirds-uk-inventory-staging.s3.amazonaws.com/test.csv',
  Key: 'text.csv',
  Bucket: 'allbirds-uk-inventory-staging'
};

const S3_FAILURE = new Error('BOOM');

const EXPECTED_ISO_DATE = '2018-07-27T20:33:20.866Z';

describe('S3Uploader', () => {
  let sandbox: sinon.SinonSandbox;
  let s3Service: S3Service;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(Date.prototype, 'toISOString').returns(EXPECTED_ISO_DATE);
    s3Service = new S3Service('accesskey', 'secretkey', 'region', 'bucket');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('upload()', () => {

    describe('Given a file name and file contents', () => {
      it('should resolve with S3.ManagedUpload.SendData', () => {
        const s3UploadStub = sandbox.stub(S3.prototype, 'upload').callsFake((params, cb) => {
          cb(null, S3_SUCCESS);
        });
        return s3Service.uploadFile(csv, 'filePrefix')
          .then((r) => {
            expect(r).not.to.be.undefined;
            expect(r.Location).to.equal(S3_SUCCESS.Location);
            expect(s3UploadStub.calledOnce).to.be.true;
            expect(s3UploadStub.args[0][0].Body).to.equal(csv);
            expect(s3UploadStub.args[0][0].Key).to.equal(`filePrefix_${EXPECTED_ISO_DATE}.csv`);
          });
      });
    });

    describe('Given an S3 error', () => {
      it('should reject with reason', () => {
        const s3UploadStub = sandbox.stub(S3.prototype, 'upload').callsFake((params, cb) => {
          cb(S3_FAILURE);
        });
        return s3Service.uploadFile('', 'filePrefix')
          .then(() => {
            throw new Error('should have rejected!');
          })
          .catch((e) => {
            expect(e.message).not.to.be.undefined;
            expect(e.message).to.equal('Uploading to S3 FAILED with: "BOOM"');
            expect(s3UploadStub.calledOnce).to.be.true;
          });
      });
    });
  });
});
