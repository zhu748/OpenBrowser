function escapeCell(value) {
  return String(value ?? '').replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|');
}
function cell(value) {
  return escapeCell(value) || '-';
}
function row(values) {
  return '| ' + values.map(cell).join(' | ') + ' |';
}

export function buildReportMarkdown(report, windows, counts, labels) {
  const parameterRows = report.params.map(parameter => row([parameter.name, parameter.key, parameter.value]));
  const windowRows = windows.map(window => row([window.name, window.country, window.account, window.result, window.reason]));
  return [
    '\uFEFF# ' + escapeCell(labels.title),
    '',
    '## ' + escapeCell(labels.taskName),
    '',
    escapeCell(report.taskName),
    '',
    row([labels.reportStatus]),
    '| --- |',
    row([labels.completed]),
    '',
    '## ' + escapeCell(labels.parameters),
    '',
    row([labels.parameterName, labels.parameterKey, labels.parameterValue]),
    '| --- | --- | --- |',
    ...parameterRows.length ? parameterRows : [row([labels.noParameters, '-', '-'])],
    '',
    '## ' + escapeCell(labels.windows),
    '',
    row([labels.window, labels.country, labels.account, labels.result, labels.reason]),
    '| --- | --- | --- | --- | --- |',
    ...windowRows.length ? windowRows : [row([labels.noParameters, '-', '-', '-', '-'])],
    '',
    '## ' + escapeCell(labels.summary),
    '',
    row([labels.total, labels.used, labels.succeeded, labels.unused, labels.successRate]),
    '| ---: | ---: | ---: | ---: | ---: |',
    row([counts.total, counts.used, counts.succeeded, counts.unused, counts.successRate]),
    '',
  ].join('\n');
}

export function reportFilename(title) {
  const filename = [...title.trim()].map(character => /[<>:"/\\|?*]/.test(character) || character.charCodeAt(0) < 32 ? '_' : character)
    .join('').replace(/\s+/g, '_').slice(0, 80);
  return (filename || 'task-report') + '.md';
}
