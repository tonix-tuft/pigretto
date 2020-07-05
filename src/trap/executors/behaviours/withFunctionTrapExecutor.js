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

import { isArray, isUndefined } from "js-utl";
import { throwErrorIfDoesNotImplement } from "./common/throwErrorIfDoesNotImplement";

export const withFunctionTrapExecutor = superclass => {
  const NewClass = class extends superclass {
    executedAtLeastOnce = false;
    lastProceedWithParamsIndexMap = {};
    finalTrapArgsMap = {};

    startExecutionContext(trapArgs) {
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          superclass.prototype,
          "startExecutionContext",
          superclass
        );
      super.startExecutionContext(trapArgs);
      if (
        !this.executedAtLeastOnce &&
        !Object.prototype.hasOwnProperty.call(this, "execContextID")
      ) {
        throw new Error(
          `pigretto - ${superclass.name} trap executor does not have "execContextID" property.`
        );
      }
      this.lastProceedWithParamsIndexMap[this.execContextID] = -1;
      this.finalTrapArgsMap[this.execContextID] = void 0;
    }

    endExecutionContext(trapArgs) {
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          superclass.prototype,
          "endExecutionContext",
          superclass
        );
      super.endExecutionContext(trapArgs);
      this.finalTrapArgsMap[this.execContextID] = void 0;
      this.executedAtLeastOnce = true;
    }

    getFinalTrapArgs(trapArgs) {
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          this,
          "getTrapArgsArgumentsListIndex",
          superclass
        );
      const argumentsListIndex = this.getTrapArgsArgumentsListIndex();
      if (
        !this.executedAtLeastOnce &&
        !Object.prototype.hasOwnProperty.call(this, "execContextStack")
      ) {
        throw new Error(
          `pigretto - ${superclass.name} trap executor does not have "execContextStack" property.`
        );
      }
      const proceedsL = this.execContextStack[this.execContextID].proceeds
        .length;
      if (proceedsL) {
        let hasParamsOverride = false;
        for (
          let i = proceedsL - 1;
          i > this.lastProceedWithParamsIndexMap[this.execContextID];
          i--
        ) {
          const { params } = this.execContextStack[this.execContextID].proceeds[
            i
          ];
          if (isArray(params)) {
            hasParamsOverride = true;
            this.lastProceedWithParamsIndexMap[this.execContextID] = i;
            trapArgs = [...trapArgs];
            trapArgs[argumentsListIndex] = params;
            this.finalTrapArgsMap[this.execContextID] = trapArgs;
            break;
          }
        }
        if (!hasParamsOverride) {
          this.lastProceedWithParamsIndexMap[this.execContextID] =
            proceedsL - 1;
        }
      }
      if (!isUndefined(this.finalTrapArgsMap[this.execContextID])) {
        return this.finalTrapArgsMap[this.execContextID];
      }
      return trapArgs;
    }

    executeAroundAdvice(trapArgs, advice, rule, proceed) {
      trapArgs = this.getFinalTrapArgs(trapArgs);
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          superclass.prototype,
          "executeAroundAdvice",
          superclass
        );
      return super.executeAroundAdvice(trapArgs, advice, rule, proceed);
    }

    executeAfterAdvice(trapArgs, advice, rule, returnValue) {
      trapArgs = this.getFinalTrapArgs(trapArgs);
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          superclass.prototype,
          "executeAfterAdvice",
          superclass
        );
      super.executeAfterAdvice(trapArgs, advice, rule, returnValue);
    }

    performUnderlyingOperation(trapArgs) {
      trapArgs = this.getFinalTrapArgs(trapArgs);
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          superclass.prototype,
          "performUnderlyingOperation",
          superclass
        );
      return super.performUnderlyingOperation(trapArgs);
    }

    executeProceedCallback(trapArgs, rule, returnValue, callback) {
      trapArgs = this.getFinalTrapArgs(trapArgs);
      !this.executedAtLeastOnce &&
        throwErrorIfDoesNotImplement(
          superclass.prototype,
          "executeProceedCallback",
          superclass
        );
      return super.executeProceedCallback(
        trapArgs,
        rule,
        returnValue,
        callback
      );
    }
  };
  Object.defineProperty(NewClass, "name", {
    value: `WithFunctionTrapExecutor(${superclass.name})`,
    configurable: true,
  });
  return NewClass;
};
