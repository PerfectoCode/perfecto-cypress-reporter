import { expect } from 'chai';
import sinon from 'sinon';

describe('Hello world', () => {
  it('should pass without explode', function () {
    expect(sinon.stub()).to.not.have.called;
  });
})
