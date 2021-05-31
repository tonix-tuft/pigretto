/*
 * Copyright (c) 2021 Anton Bagdatyev (Tonix)
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

export default class PropertyGettingPointcut extends Pointcut {
  /**
   * Register a before advice for this pointcut.
   *
   * @param {Function} adviceFn The advice function. A function to execute before getting a property.
   * @return {PropertyGettingPointcut} This pointcut (fluent interface).
   */
  before(adviceFn) {
    this.advices.push(new BeforeAdvice(adviceFn));
    return this;
  }

  /**
   * Register an after advice for this pointcut.
   *
   * @param {Function} adviceFn The advice function.
   *                            A function which will receive the current value of the property.
   * @return {PropertyGettingPointcut} This pointcut (fluent interface).
   */
  after(adviceFn) {
    this.advices.push(new AfterAdvice(adviceFn));
    return this;
  }

  /**
   * Register an around advice for this pointcut.
   *
   * @param {Function} adviceFn The advice function. A higher-order function which will receive the "proceed"
   *                            function as parameter and which MUST return a function to execute before getting a property.
   *
   *                            When not using the Flat Proceed API, if the advice function proceeds, the callback given to "proceed" will receive
   *                            the value of the property to return to the caller or may return another value to return to the caller
   *                            instead of the one passed as argument.
   *
   *                            When using the Flat Proceed API, if the advice function proceeds, the value of the property to return to the caller will be returned
   *                            by the "proceed" function. The advice function may return another value instead of the one returned.
   * @param {Object} [options] An optional object with options.
   * @param {boolean} [options.flat=false] Whether or not this around advice should use the Flat Proceed API.
   *                                       Defaults to false.
   * @return {PropertyGettingPointcut} This pointcut (fluent interface).
   */
  around(adviceFn, { flat = false } = {}) {
    this.advices.push(new AroundAdvice(adviceFn, { flat }));
    return this;
  }

  /**
   * Register an around advice using the Flat Proceed API for this pointcut.
   * This is a shortcut for and is the same as using "around(adviceFn, { flat: true })", i.e. calling "around" with the "flat" option set to true.
   *
   * @param {Function} adviceFn The advice function as in the "around" method.
   * @return {PropertyGettingPointcut} This pointcut (fluent interface).
   */
  flatAround(adviceFn) {
    return this.around(adviceFn, {
      flat: true,
    });
  }
}
