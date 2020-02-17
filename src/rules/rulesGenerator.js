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
import { isArray } from "js-utl";

const objectRulesGenerator = function*(proxyRules) {
  const ruleKeys = Reflect.ownKeys(proxyRules);
  for (const ruleKey of ruleKeys) {
    const pointcut = proxyRules[ruleKey];
    yield { rule: ruleKey, pointcut };
  }
};

const arrayRulesGenerator = function*(proxyRules) {
  for (const proxyRule of proxyRules) {
    if (isArray(proxyRule)) {
      // Tuple.
      const [rule, pointcut] = proxyRule;
      yield { rule, pointcut };
    } else {
      // Object.
      yield* objectRulesGenerator(proxyRule);
    }
  }
};

/**
 * A generator for proxy rules.
 *
 * @param {Object|Array} proxyRules An array of proxy rules or object with rules as keys.
 * @yields {Object} The next rule object, having two keys:
 *
 *                      - rule: The rule, as-is (as given by the client code);
 *                      - pointcut: The pointcut associated with that rule.
 *
 */
export default function* rulesGenerator(proxyRules) {
  const generator = declarativeFactory([
    [isArray(proxyRules), arrayRulesGenerator],
    objectRulesGenerator
  ]);
  yield* generator(proxyRules);
}
