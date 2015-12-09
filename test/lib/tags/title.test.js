'use strict';

const expect = require('expect.js');
const sinon = require('sinon');
const util = require('../../util');

describe('test/lib/tags/title.test.js', function() {
  let mm, env, engine, spy;

  before(function() {
    mm = util('general');
    env = mm.env;
    engine = mm.engine;
    spy = sinon.spy(engine.Resource.prototype, 'pageletTitle');
  });

  after(util.restore);

  it('should set title', function() {
    const tpl = '{% html %}{% title %}{{clz}}-title{% endtitle %}{% endhtml%}';
    mm.equal(tpl, '<html><title>test-title</title></html>');
    sinon.assert.calledWith(spy, 'test-title');
    spy.reset();
  });

  it('should return pagelet title', function() {
    const tpl = '{% html %}{% title %}{{clz}}-title{% endtitle %}{% endhtml%}';
    const html = env.renderString(tpl, {clz: 'test', _pagelets: 'main'});
    expect(html).to.match(/"title":\s*"test-title"/);
    sinon.assert.calledWith(spy, 'test-title');
    spy.reset();
  });
});
