'use strict';

const assert = require('assert');
const parseAttributes = require('./parseAttributes');
const helper = require('./helper');

/**
 * 自定义标签的基类，封装 tag 的通用逻辑。
 * 你可以通过继承此基类来编写 tag
 *
 * @class Tag
 *
 * @example
 * ```js
 * class CustomTag extends Tag {
 *   constructor() {
 *     super('custom');
 *   }
 *
 *   render(context, attrs, body) {
 *     //自定义输出HTML的逻辑
 *     return super.render(context, attrs, body());
 *   }
 *
 * }
 * ```
 */
class Tag {
  constructor(tagName, isBlock) {
    assert.notEqual(tagName, undefined, 'tagName 不能为空');

    this.tagName = this.outputTag = tagName;
    this.tags = [tagName];
    this.isBlock = isBlock !== false;
  }

  /**
   * 渲染 HTML, 你可以覆盖它来实现自己的渲染逻辑
   * @member Tag#render
   * @protected
   * @param {Object} context nunjucks的上下文环境, 其中 context.ctx 为 locals , context.env 为 nunjucks 的 env
   * @param {Array<String|Object>} attrs 标签里面解析出来的属性列表, 单属性为字符串, 多属性放在最后一个Object里, 如 ['checked', 'readonly', {class: ["a"], alt: "bb"}]
   * @param {Function|String} body 获取包裹的子元素内容的函数 , 或者直接字符串
   * @return {String} 生成的 HTML 字符串
   */
  render(context, attrs, body) {
    const tagName = this.outputTag;
    const attrStr = this._packAttrs(attrs);
    const fragment = (typeof body === 'function' ? body() : body) || '';
    return `<${tagName}${attrStr ? ' ' + attrStr : ''}>${fragment}</${tagName}>`;
  }

  // 提供给 nunjucks 使用的 parse 函数
  parse(parser, nodes, lexer) {  // eslint-disable-line no-unused-vars
    // get the tag token
    let token = parser.nextToken();

    // parse the args and move after the block end. passing true
    // as the second arg is required if there are no parentheses
    let args = parseAttributes(parser, nodes, lexer);
    parser.advanceAfterBlockEnd(token.value);

    let body;
    if (this.isBlock) {
      // parse the body and possibly the error block, which is optional
      body = parser.parseUntilBlocks('end' + token.value);
      parser.advanceAfterBlockEnd();
    }

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body]);
  }

  // 解析参数
  run() {
    // nunjucks sends our "body" as the last argument
    const args = Array.prototype.slice.call(arguments);
    const context = args.shift();
    const body = args.pop();

    // provide fn
    this.safe = helper.safe || context.env.filters.safe;
    this.escape = helper.escape || context.env.filters.escape;

    // render
    const html = this.render(context, args, body);
    return this.safe(html);
  }

  /**
   * 输出 HTML 的属性字符串  ['enabled', 'checked', {attr1: 'a', attr2: 'b'}] => enabled checked attr1="a" attr2="b"
   * @param {Array} attrs 待转换的数组, 可以是单个字符串, 也可以是对象
   * @return {String} 返回HTML属性字符串
   */
  _packAttrs(attrs) {
    assert.equal(Array.isArray(attrs), true, 'attrs 必须是数组');
    const escape = this.escape;

    let collect = new Set();
    attrs.forEach((item) => {
      // 单属性直接添加
      if (typeof item === 'string' || typeof item === 'number') {
        collect.add(escape(item));
      } else if (Array.isArray(item)) {
        // 数组则合并元素
        item.forEach((x) => {
          collect.add(escape(x));
        });
      } else if (typeof item === 'object') {
        // 对象, 遍历子元素
        Object.keys(item).forEach((key) => {
          let subItem = item[key];
          // __keywords不输出
          if (key !== '__keywords') {
            if (Array.isArray(subItem)) {
              // 数组, 去重 + join 后输出, 譬如 class = ['abc', someVar] => class="abc ef"
              subItem = subItem.map(x => escape(x));
              collect.add(`${escape(key)}="${Array.from(new Set(subItem)).join(' ')}"`);
            } else if (helper.isSafeString(subItem)) {
              // safe 不转义
              collect.add(`${escape(key)}="${subItem}"`);
            } else if (typeof subItem === 'object') {
              // 对象, value为true的才输出, 譬如 style={a: true, b: false, c: bool} => style="a c"
              let trueKeys = Object.keys(subItem).filter(v => subItem[v]).map(x => escape(x));
              collect.add(`${escape(key)}="${trueKeys.join(' ')}"`);
            } else {
              // 字符串, 直接添加 key="value"
              collect.add(`${escape(key)}="${escape(subItem) || ''}"`);
            }
          }
        });
      }
    });
    return Array.from(collect).join(' ');
  }
}

module.exports = Tag;
