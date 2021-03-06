'use strict';

const expect = require('expect.js');
const util = require('../../util');

describe('test/lib/tags/require.test.js', function() {
  let mm, env;

  const locals = {title: 'this is title', href: 'http://scrat.io', deep: {foo: 'foo'}, override: {foo: 'override'}};

  before(function() {
    mm = util('general');
    env = mm.env;
  });

  after(util.restore);

  it('should render require tag ', function() {
    const tpl = '{% html %}{% require $id="foo", title="this is title", href=href, deep=override %}{{deep.foo}}{% endhtml %}';
    const html = env.renderString(tpl, locals);
    expect(html).to.equal('<html><h1>this is title</h1>\n<a href="http://scrat.io">scrat</a>\n<span>override</span>foo</html>');
  });

  it('should render require tag with single url ', function() {
    const tpl = '{% html %}{% require "foo" %}{% endhtml %}';
    const html = env.renderString(tpl, locals);
    expect(html).to.equal('<html><h1>this is title</h1>\n<a href="http://scrat.io">scrat</a>\n<span>foo</span></html>');
  });
});

