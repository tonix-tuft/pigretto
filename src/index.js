/*
 * Copyright (c) 2020 Anton Bagdatyev (Tonix-Tuft)
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

// TODO

/**
 * Generates a new pigretto proxy object.
 *
 * A pigretto proxy object lets proxying and advising the following operations:
 *
 *    - Calling a method (call method);
 *    - Getting a property (get method);
 *    - Setting a property (set method);
 *    - Calling a function ([applyRule] symbol property);
 *    - Constructing a new object via the "new" keyword ([constructRule] symbol property).
 *
 * @param {*} target A function, a constructor function or an object to proxy.
 * @return {Proxy} The proxy object.
 */
// export default function pigretto(target, proxyRules) {
//   const handler = {
//     // Property access and method invocation/call.
//     get(target, property, receiver) {
//       return;
//     },

//     // Property setting.
//     set(target, property, value, receiver) {
//       return;
//     },

//     // Function invocation/call.
//     apply(target, thisArg, argumentsList) {
//       return;
//     },

//     // Object construction with the `new` operator.
//     construct(target, argumentsList, newTarget) {
//       return;
//     }
//   };
//   const proxy = new Proxy(target, handler);
//   return proxy;
// }
