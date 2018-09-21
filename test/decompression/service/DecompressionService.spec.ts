import { expect } from 'chai';

import DecompressionService from '../../../src/decompression/service/DecompressionService';

describe('DecompressionService', () => {
  const gzippedString = 'H4sIAAAAAAAA/yvJyCzWAaJEnbLEnMwUnfSqzIKC1BSd4pKizLx0ADoNkCceAAAA';
  const unzippedString = 'this,is,a,valid,gzipped,string';

  it('Given decompressing gzipped data, ' +
    'When the data deflates, ' +
    'Then it resolves with the deflated string', () => {
    return DecompressionService.decompress(gzippedString)
      .then((decompressedString) => {
        expect(decompressedString).to.equal(unzippedString);
      });
  });

  it('Given decompressing gzipped data, ' +
    'When the data fails to deflate, ' +
    'Then it rejects with an error', () => {
    return DecompressionService.decompress('invalid string')
      .then(() => {
        throw new Error('test failed');
      })
      .catch((err) => {
        expect(err.message).to.equal('incorrect header check');
      });
  });
});
