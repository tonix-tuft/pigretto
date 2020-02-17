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

import { isArray } from "js-utl";

/**
 * @type {Symbol}
 */
const noReturnValue = Symbol("noReturnValue");

export default class TrapExecutor {
  execContextStack = [];
  execContextID = -1;

  execute(trapArgs, before, around, after) {
    this.newExecutionContext();
    this.setUpExecutionContext(before, around);
    this.startExecutionContext(trapArgs);
    this.beforePhase(trapArgs, before);
    this.aroundPhase(trapArgs, around);
    const returnValue = this.proceedPhase(trapArgs);
    this.afterPhase(trapArgs, after, returnValue);
    this.endExecutionContext(trapArgs);
    this.cleanUpExecutionContext();
    return returnValue;
  }

  /**
   * @private
   */
  newExecutionContext() {
    const context = {
      proceeds: [],
      hasAtLeastOneAroundAdvice: false,
      hasAtLeastOneBeforeAdvice: false,
      returnValue: noReturnValue
    };
    this.execContextStack.push(context);
    this.execContextID++;
  }

  /**
   * @private
   */
  setUpExecutionContext(before, around) {
    this.execContextStack[
      this.execContextID
    ].hasAtLeastOneBeforeAdvice = !!before.length;
    this.execContextStack[
      this.execContextID
    ].hasAtLeastOneAroundAdvice = !!around.length;
  }

  /* eslint-disable no-unused-vars, @typescript-eslint/no-empty-function */
  startExecutionContext(trapArgs) {}
  /* eslint-enable no-unused-vars, @typescript-eslint/no-empty-function */

  /* eslint-disable no-unused-vars, @typescript-eslint/no-empty-function */
  endExecutionContext(trapArgs) {}
  /* eslint-enable no-unused-vars, @typescript-eslint/no-empty-function */

  /**
   * @private
   */
  cleanUpExecutionContext() {
    this.execContextStack.pop();
    this.execContextID--;
  }

  /**
   * @private
   */
  unsupportedMultipleProceeds(advice, rule) {
    // eslint-disable-next-line no-console
    console.error(
      "pigretto - Multiple proceeds for the same advice are not supported, subsequent proceed has been ignored.",
      "\n\tadvice: ",
      advice,
      "\n\trule: ",
      rule
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeBeforeAdvice(trapArgs, advice, rule) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeBeforeAdvice".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeAroundAdvice(trapArgs, advice, rule, proceed) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeAroundAdvice".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeAfterAdvice(trapArgs, advice, rule, returnValue) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeAfterAdvice".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  performUnderlyingOperation(trapArgs) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "performUnderlyingOperation".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeProceedCallback(trapArgs, rule, returnValue, callback) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeProceedCallback".`
    );
  }

  /**
   * @private
   */
  beforePhase(trapArgs, before) {
    for (const { rule, advice } of before) {
      this.executeBefore(trapArgs, advice, rule);
    }
  }

  /**
   * @private
   */
  executeBefore(trapArgs, advice, rule) {
    this.executeBeforeAdvice(trapArgs, advice, rule);
  }

  /**
   * @private
   */
  aroundPhase(trapArgs, around) {
    for (const { rule, advice } of around) {
      this.executeAround(trapArgs, advice, rule);
      if (
        this.execContextStack[this.execContextID].returnValue !== noReturnValue
      ) {
        break;
      }
    }
  }

  /**
   * @private
   */
  executeAround(trapArgs, advice, rule) {
    let hasProceeded = false;
    const proceed = (params = void 0, fn = void 0) => {
      if (hasProceeded) {
        this.unsupportedMultipleProceeds(advice, rule);
        return;
      }
      hasProceeded = true;
      let finalParams = void 0;
      let finalFn = void 0;
      if (isArray(params)) {
        finalParams = params;
        finalFn = typeof fn === "function" ? fn : void 0;
      } else if (typeof params === "function") {
        finalFn = params;
      }
      this.execContextStack[this.execContextID].proceeds.push({
        params: finalParams,
        fn: finalFn,
        rule
      });
    };
    const returnValue = this.executeAroundAdvice(
      trapArgs,
      advice,
      rule,
      proceed
    );
    if (!hasProceeded) {
      this.execContextStack[this.execContextID].returnValue = returnValue;
    }
  }

  /**
   * @private
   */
  afterPhase(trapArgs, after, returnValue) {
    for (const { rule, advice } of after) {
      this.executeAfter(trapArgs, advice, rule, returnValue);
    }
  }

  /**
   * @private
   */
  executeAfter(trapArgs, advice, rule, returnValue) {
    this.executeAfterAdvice(trapArgs, advice, rule, returnValue);
  }

  /**
   * @private
   */
  proceedPhase(trapArgs) {
    if (
      this.execContextStack[this.execContextID].returnValue !== noReturnValue
    ) {
      return this.return(
        trapArgs,
        this.execContextStack[this.execContextID].returnValue
      );
    }
    let returnValue = this.performUnderlyingOperation(trapArgs);
    for (const { fn: callback, rule } of this.execContextStack[
      this.execContextID
    ].proceeds) {
      if (typeof callback === "function") {
        returnValue = this.executeProceedCallback(
          trapArgs,
          rule,
          returnValue,
          callback
        );
      }
    }
    return this.return(trapArgs, returnValue);
  }

  return(trapArgs, returnValue) {
    return returnValue;
  }
}
