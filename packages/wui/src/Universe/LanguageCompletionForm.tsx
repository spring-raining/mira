import { nanoid } from 'nanoid';
import React, { useCallback, useEffect } from 'react';
import { useMonaco, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Editor } from '../Editor';

const languageId = nanoid();

export const LanguageCompletionForm: React.VFC<{
  onMount?: () => void;
  onSubmit?: (lang: string) => void;
  onBlur?: () => void;
}> = ({ onMount = () => {}, onSubmit = () => {}, onBlur = () => {} }) => {
  const monaco = useMonaco();

  const onEditorUpdate = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      // Disable commands
      // https://github.com/vikyd/vue-monaco-singleline
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F, () => {});
      editor.addCommand(monaco.KeyCode.F1, () => {});
      editor.addCommand(monaco.KeyCode.Enter, (e) => {
        const model = editor.getModel()!;
        editor.trigger('', 'acceptSelectedSuggestion', null);
        onSubmit(model.getLineContent(1).trim());
      });
      editor.onDidPaste((e) => {
        const model = editor.getModel()!;
        if (e.range.endLineNumber <= 1) {
          return;
        }
        model.setValue(model.getLineContent(1));
      });
      editor.onDidBlurEditorText(onBlur);
      editor.focus();
      onMount();
    },
    [onMount, onSubmit, onBlur]
  );
  useEffect(() => {
    if (!monaco) {
      return;
    }
    if (monaco.languages.getLanguages().some(({ id }) => id === languageId)) {
      return;
    }
    monaco.languages.register({ id: languageId });
    const availableCompletions = (() => {
      const _ = monaco.languages.getLanguages().flatMap((lang) =>
        (lang.aliases ?? []).map((alias) => ({
          id: lang.id,
          alias,
        }))
      );
      const lowerCases = _.map(({ alias }) => alias.toLowerCase());
      return _.filter(
        (c, i) => lowerCases.indexOf(c.alias.toLowerCase()) === i
      );
    })();
    monaco.languages.registerCompletionItemProvider(languageId, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: availableCompletions.map(({ id, alias }) => ({
            label: alias,
            kind: monaco.languages.CompletionItemKind.Constant,
            insertText: id,
            range,
          })),
        };
      },
    });
  }, [monaco]);

  return (
    <Editor
      language={languageId}
      padding={{ top: 0, bottom: 0 }}
      {...{ onEditorUpdate }}
    />
  );
};
