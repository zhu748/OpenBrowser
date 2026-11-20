import { h } from './workbench-vue.js';

const circles = [
  [12.5, 12.5, '0s'], [12.5, 52.5, '100ms', '.5'], [52.5, 12.5, '300ms'],
  [52.5, 52.5, '600ms'], [92.5, 12.5, '800ms'], [92.5, 52.5, '400ms'],
  [12.5, 92.5, '700ms'], [52.5, 92.5, '500ms'], [92.5, 92.5, '200ms'],
];

function render() {
  return h('svg', { viewBox: '0 0 105 105', xmlns: 'http://www.w3.org/2000/svg', fill: 'currentColor', width: '1em', height: '1em' },
    circles.map(([cx, cy, begin, opacity]) => h('circle', { cx, cy, r: '12.5', 'fill-opacity': opacity }, [
      h('animate', { attributeName: 'fill-opacity', begin, dur: '1s', values: '1;.2;1', calcMode: 'linear', repeatCount: 'indefinite' }),
    ])));
}

const GridLoader = { render };
export { render as n, GridLoader as t };
