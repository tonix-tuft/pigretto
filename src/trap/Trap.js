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

import declarativeFactory from "declarative-factory";
import MethodCallPointcut from "../pointcuts/MethodCallPointcut";
import PropertyGettingPointcut from "../pointcuts/PropertyGettingPointcut";
import PropertySettingPointcut from "../pointcuts/PropertySettingPointcut";
import FunctionCallPointcut from "../pointcuts/FunctionCallPointcut";
import ObjectConstructionPointcut from "../pointcuts/ObjectConstructionPointcut";
import ExactRule from "../rules/ExactRule";
import applyRule from "../rules/applyRule";
import constructRule from "../rules/constructRule";
import apply from "../pointcuts/shorthands/apply";
import construct from "../pointcuts/shorthands/construct";
import BeforeAdvice from "../advices/BeforeAdvice";
import AroundAdvice from "../advices/AroundAdvice";
import CallTrapExecutor from "./executors/CallTrapExecutor";
import GetTrapExecutor from "./executors/GetTrapExecutor";
import SetTrapExecutor from "./executors/SetTrapExecutor";
import ApplyTrapExecutor from "./executors/ApplyTrapExecutor";
import ConstructTrapExecutor from "./executors/ConstructTrapExecutor";
import { isUndefined } from "js-utl";

export default class Trap {
  advices = {
    // Requires matching (get trap). Requires distribution.
    call: [],

    // Requires matching (get trap). Requires distribution.
    get: [],

    // Requires matching (set trap). Requires distribution.
    set: [],

    // Does not require matching (apply trap). Requires distribution.
    apply: [],

    // Does not require matching (construct trap). Requires distribution.
    construct: []
  };

  distributedAdvices = {
    call: { before: void 0, around: void 0, after: void 0 },
    get: { before: void 0, around: void 0, after: void 0 },
    set: { before: void 0, around: void 0, after: void 0 },
    apply: { before: void 0, around: void 0, after: void 0 },
    construct: { before: void 0, around: void 0, after: void 0 }
  };

  matchedDistributedAdvices = {
    call: new Map(),
    get: new Map(),
    set: new Map()
  };

  trapExecutors = {
    call: new CallTrapExecutor(),
    get: new GetTrapExecutor(),
    set: new SetTrapExecutor(),
    apply: new ApplyTrapExecutor(),
    construct: new ConstructTrapExecutor()
  };

  /**
   * @private
   */
  hasAtLeastOneAdviceOfPointcutType(pointcutType) {
    return !!this.advices[pointcutType].length;
  }

  /**
   * @private
   */
  addAdvices(pointcutType, rule, advices = []) {
    advices.map(advice =>
      this.advices[pointcutType].push({
        rule,
        advice
      })
    );
  }

  /**
   * @private
   */
  lazilyDistributeAdvices(pointcutType) {
    if (isUndefined(this.distributedAdvices[pointcutType].before)) {
      this.distributedAdvices[pointcutType].before = [];
      this.distributedAdvices[pointcutType].around = [];
      this.distributedAdvices[pointcutType].after = [];
      for (const { rule, advice } of this.advices[pointcutType]) {
        const subKey = declarativeFactory([
          [() => advice instanceof BeforeAdvice, "before"],
          [() => advice instanceof AroundAdvice, "around"],
          "after"
        ]);
        this.distributedAdvices[pointcutType][subKey].push({ rule, advice });
      }
    }
  }

  /**
   * For "call", "get" and "set" advices.
   *
   * @private
   */
  lazilyMatchAdvices(pointcutType, property) {
    this.lazilyDistributeAdvices(pointcutType);
    const map = this.matchedDistributedAdvices[pointcutType];
    if (!map.has(property)) {
      const node = {
        before: [],
        around: [],
        after: []
      };
      map.set(property, node);
      const beforeAdvices = this.distributedAdvices[pointcutType].before;
      const aroundAdvices = this.distributedAdvices[pointcutType].around;
      const afterAdvices = this.distributedAdvices[pointcutType].after;
      const match = advices => key => {
        for (const { rule, advice } of advices) {
          const matches = rule.matches(property);
          if (matches) {
            node[key].push({ rule, advice });
          }
        }
      };
      match(beforeAdvices)("before");
      match(aroundAdvices)("around");
      match(afterAdvices)("after");
    }
  }

  /**
   * Adds a pointcut and its associated rule to this trap.
   * If a pointcut is of an unknown type, it will be ignored.
   *
   * @param {Pointcut|Function} pointcut The pointcut or a function (for implicit apply and construct pointcuts).
   * @param {Rule} rule The rule.
   * @return {Trap} This trap object.
   */
  addPointcutRule(pointcut, rule) {
    const isImplicitBeforeAdvice = () =>
      typeof pointcut === "function" && rule instanceof ExactRule;
    const pointcutType = declarativeFactory([
      [() => pointcut instanceof MethodCallPointcut, "call"],
      [() => pointcut instanceof PropertyGettingPointcut, "get"],
      [() => pointcut instanceof PropertySettingPointcut, "set"],
      [
        () => {
          const isImplicit =
            isImplicitBeforeAdvice() && rule.property === applyRule;
          if (isImplicit || pointcut instanceof FunctionCallPointcut) {
            if (isImplicit) {
              pointcut = apply().before(pointcut);
            }
            return true;
          }
          return false;
        },
        "apply"
      ],
      [
        () => {
          const isImplicit =
            isImplicitBeforeAdvice() && rule.property === constructRule;
          if (isImplicit || pointcut instanceof ObjectConstructionPointcut) {
            if (isImplicit) {
              pointcut = construct().before(pointcut);
            }
            return true;
          }
          return false;
        },
        "construct"
      ]
    ]);
    if (pointcutType) {
      const { advices } = pointcut;
      this.addAdvices(pointcutType, rule, advices);
    }
    return this;
  }

  hasGets() {
    return (
      this.hasAtLeastOneAdviceOfPointcutType("call") ||
      this.hasAtLeastOneAdviceOfPointcutType("get")
    );
  }

  hasSets() {
    return this.hasAtLeastOneAdviceOfPointcutType("set");
  }

  hasApplies() {
    return this.hasAtLeastOneAdviceOfPointcutType("apply");
  }

  hasConstructs() {
    return this.hasAtLeastOneAdviceOfPointcutType("construct");
  }

  get(target, property, receiver) {
    // Method call and property access (getting) advices.
    this.lazilyMatchAdvices("get", property);
    this.lazilyMatchAdvices("call", property);
    const {
      before: getBefore,
      around: getAround,
      after: getAfter
    } = this.matchedDistributedAdvices.get.get(property);
    const propertyValue = this.trapExecutors.get.execute(
      [target, property, receiver],
      getBefore,
      getAround,
      getAfter
    );

    const {
      before: callBefore,
      around: callAround,
      after: callAfter
    } = this.matchedDistributedAdvices.call.get(property);
    const returnValue = this.trapExecutors.call.execute(
      [target, property, receiver, propertyValue],
      callBefore,
      callAround,
      callAfter
    );

    return returnValue;
  }

  set(target, property, value, receiver) {
    // Property access (setting) advices.
    this.lazilyMatchAdvices("set", property);
    const { before, around, after } = this.matchedDistributedAdvices.set.get(
      property
    );
    return this.trapExecutors.set.execute(
      [target, property, value, receiver],
      before,
      around,
      after
    );
  }

  apply(target, thisArg, argumentsList) {
    // Function call advices.
    this.lazilyDistributeAdvices("apply");
    const { before, around, after } = this.distributedAdvices.apply;
    return this.trapExecutors.apply.execute(
      [target, thisArg, argumentsList],
      before,
      around,
      after
    );
  }

  construct(target, argumentsList, newTarget) {
    // Object construction via the "new" keyword advices.
    this.lazilyDistributeAdvices("construct");
    const { before, around, after } = this.distributedAdvices.construct;
    return this.trapExecutors.construct.execute(
      [target, argumentsList, newTarget],
      before,
      around,
      after
    );
  }
}
