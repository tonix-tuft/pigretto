/*
 * Copyright (c) 2020 Anton Bagdatyev (Tonix)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

import handlerFactory from "./factory/handlerFactory";

/**
 * Generates a new pigretto proxy object.
 *
 * A pigretto proxy object lets proxying and advising the following operations:
 *
 *    - Calling a method (`call()` method);
 *    - Getting a property (`get()` method);
 *    - Setting a property (`set()` method);
 *    - Calling a function (`[applyRule]` symbol property with `apply()` method);
 *    - Constructing a new object via the "new" keyword (`[constructRule]` symbol property with `construct()`).
 *
 * @param {*} target A function, a constructor function or an object to proxy.
 * @param {Object|Array} proxyRules The proxy rules.
 *                                  This parameter can be:
 *
 *                                      - An object containing proxy rules as keys and pointcuts with advices as values;
 *
 *                                      - An array of rules, each rule either being an object with proxy rules as keys
 *                                        and advices as values or a tuple of two elements: an array of rules of the same
 *                                        type or a single rule as the first element and a pointcut with advices for those rules or
 *                                        that rule as the second element;
 *
 * @return {Proxy} A new proxy object for the given target.
 */
export default function pigretto(target, proxyRules) {
  const handler = handlerFactory(proxyRules);
  const proxy = new Proxy(target, handler);
  return proxy;
}
