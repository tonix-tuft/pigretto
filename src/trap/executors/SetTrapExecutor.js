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

import TrapExecutor from "./TrapExecutor";
import reflectSet from "../reflect/reflectSet";
import reflectGet from "../reflect/reflectGet";

export default class SetTrapExecutor extends TrapExecutor {
  previousPropertyValueMap = {};
  returnNewPropertyValueMap = {};
  updateWasSuccessfulMap = {};

  startExecutionContext([target, property, , receiver]) {
    if (
      !Object.prototype.hasOwnProperty.call(
        this.previousPropertyValueMap,
        this.execContextID
      )
    ) {
      const previousPropertyValue = reflectGet(target, property, receiver);
      this.previousPropertyValueMap[this.execContextID] = previousPropertyValue;
      this.returnNewPropertyValueMap[this.execContextID] = void 0;
      this.updateWasSuccessfulMap[this.execContextID] = false;
    }
  }

  endExecutionContext([, , ,]) {
    delete this.previousPropertyValueMap[this.execContextID];
    delete this.returnNewPropertyValueMap[this.execContextID];
    delete this.updateWasSuccessfulMap[this.execContextID];
  }

  executeBeforeAdvice([target, property, value, receiver], advice, rule) {
    const previousPropertyValue = this.previousPropertyValueMap[
      this.execContextID
    ];
    const context = {
      target,
      property,
      value,
      receiver,
      rule,
    };
    advice.fn.apply(context, [previousPropertyValue]);
  }

  executeAroundAdvice(
    [target, property, value, receiver],
    advice,
    rule,
    proceed
  ) {
    const previousPropertyValue = this.previousPropertyValueMap[
      this.execContextID
    ];
    const context = {
      target,
      property,
      value,
      receiver,
      rule,
    };
    return advice.fn
      .call(context, proceed)
      .apply(context, [previousPropertyValue]);
  }

  executeAfterAdvice(
    [target, property, value, receiver],
    advice,
    rule,
    updateWasSuccessful
  ) {
    const previousPropertyValue = this.previousPropertyValueMap[
      this.execContextID
    ];
    const newPropertyValue = this.returnNewPropertyValueMap[this.execContextID];
    const context = {
      target,
      property,
      value,
      receiver,
      rule,
      updateWasSuccessful,
    };
    advice.fn
      .call(context, previousPropertyValue)
      .apply(context, [newPropertyValue]);
  }

  performUnderlyingOperation([target, property, value, receiver]) {
    const updateWasSuccessful = reflectSet(target, property, value, receiver);
    this.updateWasSuccessfulMap[this.execContextID] = updateWasSuccessful;
    this.returnNewPropertyValueMap[this.execContextID] = value;
    return value;
  }

  executeProceedCallback(
    [target, property, value, receiver],
    rule,
    newPropertyValue,
    callback
  ) {
    const context = {
      target,
      property,
      value,
      receiver,
      rule,
    };
    const returnValue = callback.apply(context, [newPropertyValue]);
    return returnValue;
  }

  return([target, property, , receiver], returnValue) {
    if (returnValue !== this.returnNewPropertyValueMap[this.execContextID]) {
      this.performUnderlyingOperation([
        target,
        property,
        returnValue,
        receiver,
      ]);
    }
    return this.updateWasSuccessfulMap[this.execContextID];
  }
}
