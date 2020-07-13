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

import pigretto from "../pigretto";
import get from "../pointcuts/shorthands/get";

/**
 * @type {Symbol}
 */
const queueTupleProp = Symbol("queueTupleProp");

/**
 * @type {Symbol}
 */
const dataProp = Symbol("dataProp");

/**
 * @type {Function}
 */
const dummyNoOp = () => {
  // Just a dummy no-op function. Required when the Proxy API is polyfilled with proxy-polyfill (https://github.com/GoogleChrome/proxy-polyfill/)
};

/**
 * Builtin function using pigretto's API to create a POJO promiser,
 * i.e. a proxy object with syntactic sugar which lets creating a queue of properties to resolve
 * and resolves to an object with those same properties and their respective resolved values.
 *
 * @see https://gist.github.com/jasuperior/5d339f9c2572b3bb52d487de4086a3b2
 *
 * @param {Object} obj A POJO object where each property refers to a value to use as is or to a promise
 *                     resolving to the value to use for that property.
 * @param {Object} options Options.
 * @param {boolean} [options.mutateTargetOnSettledPromiseQueue] Whether or not to mutate the original given "obj" POJO object
 *                                                              with the resolved values or not (defaults to false,
 *                                                              i.e. it does not mutate the original "obj" POJO object).
 * @return {Proxy} A new proxy object for the given target which supports this builtin feature.
 */
export default function POJOPromiser(
  obj,
  { mutateTargetOnSettledPromiseQueue = false } = {}
) {
  const originalTarget = obj;

  // This is needed because the Proxy API may be polyfilled with proxy-polyfill (https://github.com/GoogleChrome/proxy-polyfill/).
  // Cloning "obj" allows setting properties on the target clone.
  const target = {
    ...obj,
  };

  const that = {
    [queueTupleProp]: void 0,
    [dataProp]: {},
  };
  const rules = {
    ["/.?/"]: get().around(function () {
      const { property: prop, target } = this;

      if (prop === "then" && that[queueTupleProp]) {
        // If "then" is accessed, and there is something in the queue.
        const [queuedProp, queuedPromise] = that[queueTupleProp];
        const promise = queuedPromise.then(data => {
          const obj = that[dataProp]; // Resolved data from last promise.
          obj[queuedProp] = data;
          return new Promise(resolve => {
            that[dataProp] = {}; // Erase data.
            that[queueTupleProp] = void 0; // Clear queue.
            resolve(obj); // Resolve promise queue.
            if (obj && mutateTargetOnSettledPromiseQueue) {
              // Assign resolved values to the original target, so that properties which value is a promise will be replaced with the resolved value.
              Object.assign(originalTarget, obj);
            }
          });
        });
        const then = promise.then.bind(promise);
        return then;
      }

      let promise;

      if (!(target[prop] instanceof Promise) && prop !== "then") {
        // If the prop is not "then" or a promise, i.e. it is a real value.
        if (that[queueTupleProp]) {
          // If there is a queue.
          const [queuedProp, queuedPromise] = that[queueTupleProp];
          const obj = that[dataProp];
          promise = queuedPromise.then(data => {
            // Resolve last promise.
            obj[queuedProp] = data;
            return Promise.resolve(target[prop]);
          });
        } else {
          // Otherwise, simply create a new promise with value.
          that[dataProp] = {};
          promise = Promise.resolve(target[prop]);
        }
      }

      if (that[queueTupleProp]) {
        // If it is a promise and there is a queue.
        const [queuedProp, queuedPromise] = that[queueTupleProp];
        const obj = that[dataProp];
        promise = queuedPromise.then(data => {
          // Resolve last promise.
          obj[queuedProp] = data;
          return target[prop];
        });
      } else if (!promise) {
        // target[prop] is of course a promise here (invariant).
        that[dataProp] = {};
        promise = target[prop];
      }

      that[queueTupleProp] = [prop, promise]; // Save the promise and the property in the queue.
      // All alternations ensure that no matter what the value, a promise which must be resolved is always given.
      target.then = dummyNoOp;
      const pigrettarget = pigretto(target, rules);
      return pigrettarget;
    }),
  };
  target.then = dummyNoOp;
  const pigrettarget = pigretto(target, rules);
  return pigrettarget;
}
