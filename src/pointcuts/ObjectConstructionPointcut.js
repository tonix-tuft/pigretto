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

import Pointcut from "./Pointcut";
import BeforeAdvice from "../advices/BeforeAdvice";
import AfterAdvice from "../advices/AfterAdvice";
import AroundAdvice from "../advices/AroundAdvice";

export default class ObjectConstructionPointcut extends Pointcut {
  /**
   * Register a before advice for this pointcut.
   *
   * @param {Function} adviceFn The advice function. A function which receives the constructor parameters
   *                            of the underlying proxied object construction.
   * @return {ObjectConstructionPointcut} This pointcut (fluent interface).
   */
  before(adviceFn) {
    this.advices.push(new BeforeAdvice(adviceFn));
    return this;
  }

  /**
   * Register an after advice for this pointcut.
   *
   * @param {Function} adviceFn The advice function. A higher-order function which will receive
   *                            the parameters of the proxied object construction and MUST return a function
   *                            which will receive the instance object created by the underlying proxied
   *                            object construction.
   * @return {ObjectConstructionPointcut} This pointcut (fluent interface).
   */
  after(adviceFn) {
    this.advices.push(new AfterAdvice(adviceFn));
    return this;
  }

  /**
   * Register an around advice for this pointcut.
   *
   * @param {Function} adviceFn The advice function. A higher-order function which will receive the "proceed"
   *                            function as parameter and which MUST return a function which will receive the constructor parameters
   *                            of the underlying object construction.
   *                            If the advice function proceeds, the callback given to "proceed" will receive
   *                            the instance object to return to the caller or may return another instance
   *                            instead of the current one.
   * @return {ObjectConstructionPointcut} This pointcut (fluent interface).
   */
  around(adviceFn) {
    // TODO: Flat Proceed API
    this.advices.push(new AroundAdvice(adviceFn));
    return this;
  }
}
