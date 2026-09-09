import { playgroundLimits, playgroundSizeError } from '../lib/playground-limits';
import { setStatus } from './playground-status';
import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory } from '@codemirror/commands';

const silentChange = Annotation.define<boolean>();

export function createPlaygroundEditor(name: 'input' | 'template' | 'output', extensions: Extension[], wrap: boolean) {
  const root = document.querySelector<HTMLElement>(`[data-editor="${name}"]`)!;
  const initialValue = root.querySelector('textarea')!.value;
  const limit = playgroundLimits[name];
  const value = initialValue.length <= limit ? initialValue : '';
  const status = document.getElementById(`${name}-status`)!;
  const showSizeError = () => setStatus(status, playgroundSizeError(name), 'error');
  if (initialValue.length > limit) showSizeError();
  const readonly = name === 'output';
  const listeners: (() => void)[] = [];
  const wrapping = new Compartment();
  root.replaceChildren();
  const view = new EditorView({
    parent: root,
    state: EditorState.create({
      doc: value,
      extensions: [
        EditorState.transactionFilter.of(transaction => {
          if (transaction.newDoc.length <= limit) return transaction;
          showSizeError();
          return [];
        }),
        extensions,
        lineNumbers(), drawSelection(),
        wrapping.of(wrap ? EditorView.lineWrapping : []),
        EditorState.tabSize.of(2),
        EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly),
        readonly ? keymap.of(defaultKeymap) : [history(), keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])],
        EditorView.contentAttributes.of({
          id: `playground-${name}`, 'aria-label': name === 'input' ? 'Data' : name[0].toUpperCase() + name.slice(1),
          'aria-describedby': `${name}-status${readonly ? '' : ` ${name}-file-status`}`,
          role: 'textbox', 'aria-readonly': String(readonly), tabindex: '0', spellcheck: 'false', autocapitalize: 'off',
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || update.transactions.every((transaction) => transaction.annotation(silentChange))) return;
          root.dispatchEvent(new Event('playground-change', { bubbles: true }));
          listeners.forEach((listener) => listener());
        }),
      ],
    }),
  });
  return {
    status: document.getElementById(`${name}-status`)!,
    element: view.contentDOM,
    get value() { return view.state.doc.toString(); },
    measure: () => !root.clientWidth ? Promise.resolve() : new Promise<void>((resolve) => {
      view.requestMeasure({ read: () => undefined, write: () => resolve() });
    }),
    setWrap(enabled: boolean) {
      view.dispatch({ effects: wrapping.reconfigure(enabled ? EditorView.lineWrapping : []) });
    },
    setValue(text: string, { reset = true, notify = true } = {}) {
      if (text.length > limit) { showSizeError(); return; }
      const previous = view.state.doc.toString();
      if (previous === text && !reset) return;
      // Patch only the changed text so output selections and scroll anchors
      // can follow updates without jumping back to the beginning.
      let from = 0, to = previous.length, end = text.length;
      if (!reset) {
        while (from < to && from < end && previous[from] === text[from]) from++;
        while (to > from && end > from && previous[to - 1] === text[end - 1]) { to--; end--; }
      }
      const changes = view.state.changes({ from, to, insert: text.slice(from, end) });
      view.dispatch({
        changes,
        selection: reset ? { anchor: 0 } : undefined,
        effects: reset ? [] : view.scrollSnapshot().map(changes) ?? [],
        annotations: [silentChange.of(!notify), isolateHistory.of('full')],
      });
      if (reset) view.scrollDOM.scrollTop = view.scrollDOM.scrollLeft = 0;
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
