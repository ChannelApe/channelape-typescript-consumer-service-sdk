import { S3 } from 'aws-sdk';

export default class S3Uploader {
  private readonly s3: S3;
  private readonly awsS3Bucket: string;

  constructor(awsAccessKeyId: string, awsSecretAccessKey: string, awsRegion: string, awsS3Bucket: string) {
    this.awsS3Bucket = awsS3Bucket;
    this.s3 = new S3({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: awsRegion
    });
  }

  public uploadFile(fileContents: string, filePrefix: string): Promise<S3.ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      const fileName = this.getS3Key(filePrefix);
      this.s3.upload({
        Body: fileContents,
        Key: fileName,
        Bucket: this.awsS3Bucket
      }, (err: Error, data: S3.ManagedUpload.SendData) => {
        if (err) {
          reject(new Error(`Uploading to S3 FAILED with: "${err.message}"`));
          return;
        }
        resolve(data);
      });
    });
  }

  private getS3Key(filePrefix: string): string {
    const date = new Date().toISOString();
    return `${filePrefix}_${date}.csv`;
  }
}
