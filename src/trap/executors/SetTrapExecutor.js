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
import { isArray, shallowExtend } from "js-utl";

/**
 * @type {Object}
 */
const noValue = {};

const performUnderlyingOperationNoValue = {};

export default class SetTrapExecutor extends TrapExecutor {
  previousPropertyValueMap = {};
  returnNewPropertyValueMap = {};
  updateWasSuccessfulMap = {};
  originalValue = {};
  performUnderlyingOperationValueMap = {};

  startExecutionContext([target, property, value, receiver]) {
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
      this.returnNewPropertyValueMap[this.execContextID] = noValue;
      this.updateWasSuccessfulMap[this.execContextID] = false;
      this.originalValue[this.execContextID] = value;
      this.performUnderlyingOperationValueMap[
        this.execContextID
      ] = performUnderlyingOperationNoValue;
    }
  }

  endExecutionContext([, , ,]) {
    delete this.previousPropertyValueMap[this.execContextID];
    delete this.returnNewPropertyValueMap[this.execContextID];
    delete this.updateWasSuccessfulMap[this.execContextID];
    delete this.originalValue[this.execContextID];
    delete this.performUnderlyingOperationValueMap[this.execContextID];
  }

  executeBeforeAdvice([target, property, value, receiver], advice, rule) {
    const previousPropertyValue = this.previousPropertyValueMap[
      this.execContextID
    ];
    const originalValue = this.originalValue[this.execContextID];
    const context = {
      target,
      property,
      value,
      originalValue,
      receiver,
      rule,
    };
    this.notWithinExecContext(() => {
      advice.fn.apply(context, [previousPropertyValue]);
    });
  }

  getFinalValue(value) {
    if (this.returnNewPropertyValueMap[this.execContextID] !== noValue) {
      value = this.returnNewPropertyValueMap[this.execContextID];
    }
    return value;
  }

  executeAroundAdvice(
    [target, property, value, receiver],
    advice,
    rule,
    proceed,
    context
  ) {
    value = this.getFinalValue(value);
    const previousPropertyValue = this.previousPropertyValueMap[
      this.execContextID
    ];
    const originalValue = this.originalValue[this.execContextID];
    shallowExtend(context, {
      target,
      property,
      value,
      originalValue,
      receiver,
      rule,
      flat: advice.flat,
    });
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
    const originalValue = this.originalValue[this.execContextID];
    const context = {
      target,
      property,
      value,
      originalValue,
      receiver,
      rule,
      updateWasSuccessful,
      hasPerformedUnderlyingOperation: this.execContextStack[this.execContextID]
        .hasPerformedUnderlyingOperation,
      hasEffectivelyPerformedUnderlyingOperation: TrapExecutor.getTransversalExecContextStackData(
        "hasEffectivelyPerformedUnderlyingOperation"
      ),
    };
    this.notWithinExecContext(() => {
      advice.fn
        .call(context, previousPropertyValue)
        .apply(context, [newPropertyValue]);
    });
  }

  performUnderlyingOperation([target, property, value, receiver]) {
    value = this.getFinalValue(value);
    const updateWasSuccessful = this.notWithinExecContext(
      () => {
        const updateWasSuccessful = reflectSet(
          target,
          property,
          value,
          receiver
        );
        return updateWasSuccessful;
      },
      target,
      true
    );
    this.updateWasSuccessfulMap[this.execContextID] = updateWasSuccessful;
    this.returnNewPropertyValueMap[this.execContextID] = value;
    this.performUnderlyingOperationValueMap[this.execContextID] = value;
    return value;
  }

  executeProceedCallback(
    [target, property, value, receiver],
    rule,
    newPropertyValue,
    callback
  ) {
    value = this.getFinalValue(value);
    const originalValue = this.originalValue[this.execContextID];
    const context = {
      target,
      property,
      value,
      originalValue,
      receiver,
      rule,
      hasPerformedUnderlyingOperation: this.execContextStack[this.execContextID]
        .hasPerformedUnderlyingOperation,
      hasEffectivelyPerformedUnderlyingOperation: TrapExecutor.getTransversalExecContextStackData(
        "hasEffectivelyPerformedUnderlyingOperation"
      ),
    };
    const returnValue = this.notWithinExecContext(() => {
      return callback.apply(context, [newPropertyValue]);
    });
    this.returnNewPropertyValueMap[this.execContextID] = returnValue;
    return returnValue;
  }

  return([target, property, , receiver], returnValue) {
    if (
      this.performUnderlyingOperationValueMap[this.execContextID] !==
        this.returnNewPropertyValueMap[this.execContextID] ||
      returnValue !== this.returnNewPropertyValueMap[this.execContextID]
    ) {
      this.performUnderlyingOperation([
        target,
        property,
        returnValue,
        receiver,
      ]);
    }
    return this.updateWasSuccessfulMap[this.execContextID];
  }

  onProceed(finalParams) {
    if (isArray(finalParams)) {
      const [value] = finalParams;
      this.returnNewPropertyValueMap[this.execContextID] = value;
    }
  }

  onNoProceed(returnValue) {
    this.returnNewPropertyValueMap[this.execContextID] = returnValue;
  }
}
