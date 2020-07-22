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
import { isArray } from "js-utl";

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
      const previousPropertyValue = this.notWithinExecContext(() => {
        const previousPropertyValue = reflectGet(target, property, receiver);
        return previousPropertyValue;
      }, target);
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
    this.notWithinExecContext(() => {
      advice.fn.apply(context, [previousPropertyValue]);
    });
  }

  getFinalValue(value) {
    const params = this.execContextStack[this.execContextID].finalParams;
    if (isArray(params)) {
      const [finalValue] = params;
      value = finalValue;
    }
    return value;
  }

  executeAroundAdvice(
    [target, property, value, receiver],
    advice,
    rule,
    proceed
  ) {
    value = this.getFinalValue(value);
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
    const returnValue = this.notWithinExecContext(() => {
      const returnValue = advice.fn
        .call(context, proceed)
        .apply(context, [previousPropertyValue]);
      return returnValue;
    });
    return returnValue;
  }

  executeAfterAdvice(
    [target, property, value, receiver],
    advice,
    rule,
    updateWasSuccessful
  ) {
    value = this.getFinalValue(value);
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
    this.notWithinExecContext(() => {
      advice.fn
        .call(context, previousPropertyValue)
        .apply(context, [newPropertyValue]);
    });
  }

  performUnderlyingOperation([target, property, value, receiver]) {
    value = this.getFinalValue(value);
    const updateWasSuccessful = this.notWithinExecContext(() => {
      const updateWasSuccessful = reflectSet(target, property, value, receiver);
      return updateWasSuccessful;
    }, target);
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
    value = this.getFinalValue(value);
    const context = {
      target,
      property,
      value,
      receiver,
      rule,
    };
    const returnValue = this.notWithinExecContext(() => {
      return callback.apply(context, [newPropertyValue]);
    });
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
