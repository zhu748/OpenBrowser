<script setup>
import { markRaw, onMounted, onUnmounted, ref, useTemplateRef, watch } from './workbench-vue.js';
import { EditorState, EditorView, HighlightStyle, indentGuide, json, javascript, keymap, lineNumbers, lintGutter,
  linter, defaultKeymap, historyKeymap, indentWithTab, mergeEditorTheme, syntaxHighlighting, tags } from './workbench-codemirror.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ editable: { type: Boolean, default: true }, showLineNumbers: Boolean,
  language: { default: 'json' }, theme: { type: Object, default: () => ({}) } });
const value = defineModel();
const container = useTemplateRef('editor');
const editor = ref(null);

const jsonLint = linter(view => {
  try {
    JSON.parse(view.state.doc.toString());
    return [];
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const offset = Number(/at position (\d+)/.exec(error.message)?.[1] ?? 0);
    return [{ from: offset, to: offset, severity: 'error', message: `JSON语法错误: ${error.message}` }];
  }
});
const jsonColors = HighlightStyle.define([
  { tag: tags.propertyName, color: '#6EC3FF' }, { tag: tags.string, color: '#F57FFD' },
  { tag: tags.number, color: '#9543de' }, { tag: tags.bool, color: '#F2994A' },
  { tag: tags.null, color: '#D73A49' }, { tag: tags.punctuation, color: 'rgba(255, 255, 255,0.4)' },
]);
const scriptColors = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: '#F2994A' },
  { tag: tags.string, color: '#A5D6FF' }, { tag: tags.comment, color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' },
  { tag: tags.number, color: '#9543de' }, { tag: tags.bool, color: '#F2994A' }, { tag: tags.null, color: '#D73A49' },
  { tag: tags.propertyName, color: '#6EC3FF' }, { tag: tags.function(tags.variableName), color: '#F57FFD' },
  { tag: [tags.definition(tags.variableName), tags.typeName], color: '#79C0FF' },
  { tag: tags.punctuation, color: 'rgba(255, 255, 255, 0.6)' }, { tag: tags.operator, color: 'rgba(255, 255, 255, 0.8)' },
]);
const border = '1px solid var(--colors-border-border-subtle, #C7D1D6)';
const background = 'var(--pattern-editor-bg, #2C2E30)';
const baseTheme = {
  '&': { height: '100%', border, borderRadius: '6px', overflow: 'hidden' },
  '.cm-scroller': { overflow: 'auto' }, '.cm-gutters': { backgroundColor: background, borderRight: border },
  '.cm-gutter-lint': { width: '16px' }, '.cm-gutter-lint .cm-gutterElement': { padding: '1px 2px' },
  '.cm-lint-marker': { fontSize: '12px' },
  '.cm-lineNumbers .cm-gutterElement': { paddingLeft: '12px', color: 'var(--colors-text-text-inactive, #7D8387)', fontFamily: 'JetBrains Mono', fontSize: '12px', lineHeight: 'normal' },
  '.cm-content': { backgroundColor: background, padding: '12px', color: 'var(--pattern-editor-code, #ffffff)', fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: '500', lineHeight: 'normal' },
  '.cm-line': { padding: '0px' },
};
onMounted(() => {
  if (!container.value) return;
  const isJson = props.language === 'json';
  const state = EditorState.create({ doc: value.value, extensions: [
    props.showLineNumbers ? lineNumbers() : [], props.showLineNumbers && isJson ? lintGutter() : [], indentGuide({ minDepth: 20 }),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]), EditorView.editable.of(props.editable), EditorView.updateListener.of(update => {
      if (update.docChanged) value.value = update.state.doc.toString();
    }), EditorView.lineWrapping, EditorView.theme(mergeEditorTheme(baseTheme, props.theme)), isJson ? jsonLint : [],
    syntaxHighlighting(isJson ? jsonColors : scriptColors), isJson ? json() : javascript({ typescript: true }),
  ] });
  editor.value = markRaw(new EditorView({ state, parent: container.value }));
});
watch(value, text => {
  const view = editor.value;
  if (view && text !== undefined && !props.editable && text !== view.state.doc.toString()) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
  }
});
onUnmounted(() => editor.value?.destroy());
</script>

<template>
  <div ref="editor" class="w-full h-full" :class="$attrs.class"></div>
</template>
