import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory } from '@codemirror/commands';
import { autocompletion, completionKeymap, acceptCompletion } from '@codemirror/autocomplete';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { templateCompletions, type TemplateSuggestion } from '../lib/playground-completions';
import { emptyTemplatePair, pairTemplateInput } from '../lib/playground-pairs';
import { markdownPunctuationAt } from '../lib/markdown-punctuation';

const language = StreamLanguage.define({
  startState: () => ({ close: '', quote: '', filter: false }),
  token(stream, state) {
    if (!state.close) {
      if (stream.match('{{')) state.close = '}}';
      else if (stream.match('{%')) state.close = '%}';
      else {
        const length = markdownPunctuationAt(stream.string, stream.pos);
        if (length) { stream.pos += length; return 'punctuation'; }
        stream.next();
        return null;
      }
      return 'punctuation';
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

export function createTemplateEditor(variables: () => Record<string, unknown>) {
  const root = document.querySelector<HTMLElement>('[data-editor="template"]')!;
  const fallback = root.querySelector('textarea')!;
  const value = fallback.value;
  const status = document.getElementById('template-status')!;
  const filters: TemplateSuggestion[] = JSON.parse(document.getElementById('playground-filter-completions')!.textContent!);
  const listeners: (() => void)[] = [];
  root.replaceChildren();
  const view = new EditorView({
    parent: root,
    state: EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(), history(), drawSelection(), language,
        EditorState.tabSize.of(2),
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
        EditorView.contentAttributes.of({ id: 'playground-template', 'aria-label': 'Template', 'aria-describedby': 'template-status template-file-status', spellcheck: 'false', autocapitalize: 'off' }),
        syntaxHighlighting(HighlightStyle.define([
          { tag: tags.variableName, class: 'syn-variable' },
          { tag: tags.function(tags.variableName), class: 'syn-filter' },
          { tag: tags.keyword, class: 'syn-keyword' },
          { tag: tags.string, class: 'syn-string' },
          { tag: tags.number, class: 'syn-number' },
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
        }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            root.dispatchEvent(new Event('playground-change', { bubbles: true }));
            listeners.forEach((listener) => listener());
          }
        }),
      ],
    }),
  });
  return {
    status,
    element: view.contentDOM,
    get value() { return view.state.doc.toString(); },
    setValue(text: string) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, selection: { anchor: 0 }, scrollIntoView: true, annotations: isolateHistory.of('full') });
      view.scrollDOM.scrollTop = view.scrollDOM.scrollLeft = 0;
    },
    onChange(listener: () => void) { listeners.push(listener); },
    selectDiagnostic(line: number, column: number) {
      const target = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)));
      const from = Math.min(target.to, target.from + Math.max(0, column - 1));
      view.dispatch({ selection: { anchor: from, head: Math.min(from + 1, target.to) }, effects: EditorView.scrollIntoView(from, { y: 'center' }) });
      view.focus();
    },
  };
}
