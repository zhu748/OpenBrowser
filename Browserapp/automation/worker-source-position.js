'use strict';

// Serialized into inline workers and reused by network response injection.
// Keep the directive prologue and every ECMAScript hashbang line terminator.
function workerInjectionPosition(source, syntax) {
  let position = 0;
  if (source.startsWith('#!')) {
    const end = source.search(/[\r\n\u2028\u2029]/);
    position = end < 0 ? source.length : end + (source.slice(end, end + 2) === '\r\n' ? 2 : 1);
  }
  const options = { ecmaVersion: 'latest', allowHashBang: true, sourceType: 'module' };
  try {
    const tokens = syntax.tokenizer(source, options);
    let token = tokens.getToken();
    while (token.type.label === 'string') {
      const expression = syntax.parseExpressionAt(source, token.start, options);
      if (expression.type !== 'Literal' || typeof expression.value !== 'string') break;
      do { token = tokens.getToken(); } while (token.start < expression.end);
      if (token.type.label === ';') {
        position = token.end; token = tokens.getToken();
      } else if (token.type.label === 'eof' || /[\r\n\u2028\u2029]/.test(source.slice(expression.end, token.start))) {
        position = expression.end;
      } else break;
    }
  } catch (_) { /* Native parsing remains responsible for invalid programs. */ }
  return position;
}

module.exports = { workerInjectionPosition };
