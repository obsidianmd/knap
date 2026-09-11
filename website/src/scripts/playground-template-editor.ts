import { maxHighlightLineLength } from '../lib/playground-limits';
import { EditorView, keymap } from '@codemirror/view';
import { autocompletion, completionKeymap, acceptCompletion } from '@codemirror/autocomplete';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { templateCompletions, type TemplateSuggestion } from '../lib/playground-completions';
import { emptyTemplatePair, pairTemplateInput } from '../lib/playground-pairs';
import { markdownPunctuationAt } from '../lib/markdown-punctuation';
import { createPlaygroundEditor } from './playground-editor';

export const templateLanguage = StreamLanguage.define({
  startState: () => ({ close: '', quote: '', filter: false }),
  token(stream, state) {
    if (stream.string.length > maxHighlightLineLength) {
      stream.skipToEnd(); state.close = ''; state.quote = ''; state.filter = false;
      return null;
    }
    if (!state.close) {
      if (stream.match('{{')) state.close = '}}';
      else if (stream.match('{%')) state.close = '%}';
      else if (stream.match('{#')) { state.close = '#}'; return 'comment'; }
      else {
        const length = markdownPunctuationAt(stream.string, stream.pos);
        if (length) { stream.pos += length; return 'punctuation'; }
        stream.next();
        return null;
      }
      return 'punctuation';
    }
    if (state.close === '#}') {
      if (stream.skipTo('#}')) { stream.match('#}'); state.close = ''; }
      else stream.skipToEnd();
      return 'comment';
    }
    if (!state.quote && stream.match(state.close)) {
      state.close = ''; state.filter = false;
      return 'punctuation';
    }
    if (state.quote || stream.peek() === '"' || stream.peek() === "'") {
      if (!state.quote) state.quote = stream.next()!;
      while (!stream.eol()) {
        const char = stream.next();
        if (char === '\\') stream.next();
        else if (char === state.quote) { state.quote = ''; break; }
      }
      return 'string';
    }
    if (stream.eatSpace()) return null;
    if (stream.match('||')) return 'operator';
    if (stream.match('|')) { state.filter = true; return 'operator'; }
    if (stream.match(/\d+(?:\.\d+)?/)) return 'number';
    if (stream.match(/[a-zA-Z_$][\w$]*/)) {
      if (state.filter) { state.filter = false; return 'filter'; }
      return /^(if|else|elseif|endif|for|in|endfor|set|and|or|not|contains|true|false|null)$/.test(stream.current()) ? 'keyword' : 'variableName';
    }
    stream.next();
    return 'punctuation';
  },
  tokenTable: { filter: tags.function(tags.variableName) },
});

export function createTemplateEditor(variables: () => Record<string, unknown>, wrap = false) {
  const filters: TemplateSuggestion[] = JSON.parse(document.getElementById('playground-filter-completions')!.textContent!);
  return createPlaygroundEditor('template', [
    templateLanguage,
    EditorView.inputHandler.of((view, from, to, text, insert) => {
      if (view.composing || view.state.selection.ranges.length !== 1 || !insert().isUserEvent('input.type')) return false;
      const paired = pairTemplateInput(view.state.doc.toString(), from, to, text);
      if (!paired) return false;
      view.dispatch({
        changes: { from: paired.from, to: paired.to, insert: paired.insert },
        selection: { anchor: paired.anchor },
        userEvent: paired.insert ? 'input.type' : 'select',
        scrollIntoView: true,
      });
      return true;
    }),
    syntaxHighlighting(HighlightStyle.define([
      { tag: tags.variableName, class: 'syn-variable' },
      { tag: tags.function(tags.variableName), class: 'syn-filter' },
      { tag: tags.keyword, class: 'syn-keyword' },
      { tag: tags.string, class: 'syn-string' },
      { tag: tags.number, class: 'syn-number' },
      { tag: tags.comment, class: 'syn-comment' },
      { tag: [tags.punctuation, tags.operator], class: 'syn-punctuation' },
    ])),
    autocompletion({
      icons: false,
      optionClass: (completion) => {
        if (completion.type === 'variable' || completion.type === 'property') return 'playground-completion-variable';
        if (completion.type === 'function') return 'playground-completion-filter';
        if (completion.type === 'enum') return 'playground-completion-parameter';
        return completion.type === 'keyword' ? 'playground-completion-keyword' : '';
      },
      activateOnTypingDelay: 80,
      override: [(context) => templateCompletions(context.state.doc.toString(), context.pos, variables(), filters)],
    }),
    keymap.of([...completionKeymap, { key: 'Tab', run: acceptCompletion }, {
      key: 'Backspace',
      run(view) {
        if (!view.state.selection.main.empty || view.state.selection.ranges.length !== 1) return false;
        const pair = emptyTemplatePair(view.state.doc.toString(), view.state.selection.main.head);
        if (!pair) return false;
        view.dispatch({ changes: pair, selection: { anchor: pair.from }, userEvent: 'delete.backward' });
        return true;
      },
    }]),
  ], wrap);
}
