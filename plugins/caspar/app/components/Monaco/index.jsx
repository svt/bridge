import React from 'react'
import bridge from 'bridge'

import './style.css'

import * as monaco from 'monaco-editor'

import tinycolor from 'tinycolor2'

const VARIABLE_REGEX = /\$\((.*?)\)/
const VARIABLE_REGEX_GLOBAL = /\$\((.*?)\)/g

const F_FIELD_REGEX = /"f\d+"/

const CUSTOM_LANGUAGE_NAME = 'bridgeLang'

/**
 * Code in this component is based on the
 * official documentation for the Monaco editor
 * 
 * @see https://microsoft.github.io/monaco-editor/typedoc/index.html
 */
export const Monaco = ({ defaultValue = '', value = '', onChange = () => {} }) => {
  const elRef = React.useRef()
  const modelRef = React.useRef()

  React.useEffect(() => {
    const style = getComputedStyle(document.body)

    const themeColors = {
      'editor.foreground': style.getPropertyValue('--base-color').trim(),
      'editor.background': style.getPropertyValue('--base-color--background').trim()
    }

    /*
    Replace any color values
    with their hex strings

    For example
    'white' -> '#fffffff'
    */
    for (const key of Object.keys(themeColors)) {
      themeColors[key] = tinycolor(themeColors[key]).toHexString()
    }

    monaco.languages.register({ id: CUSTOM_LANGUAGE_NAME })
    monaco.languages.setMonarchTokensProvider(CUSTOM_LANGUAGE_NAME, {
      tokenizer: {
        root: [
          [VARIABLE_REGEX, 'bridge-variable'],
          [F_FIELD_REGEX, 'bridge-caspar-f-field']
        ],
      },
    })

    /*
    Define a custom theme
    that highlights variables
    and other template keywords
    */
    monaco.editor.defineTheme('bridgeCurrentTheme', {
      base: tinycolor(themeColors['editor.background']).isLight() ? 'vs' : 'vs-dark',
      inherit: true,
      rules: [
        { token: 'bridge-variable', foreground: tinycolor(style.getPropertyValue('--base-color--accent1')).toHexString(), fontStyle: 'bold' },
        { token: 'bridge-caspar-f-field', foreground: tinycolor(style.getPropertyValue('--base-color--accent1')).toHexString() }
      ],
      colors: themeColors
    })
    monaco.editor.setTheme('bridgeCurrentTheme')

    /*
    Show a variable's
    value when hovered over
    */
    monaco.languages.registerHoverProvider(CUSTOM_LANGUAGE_NAME, {
      provideHover: async (model, position) => {
        const line = model.getLineContent(position.lineNumber)

        /*
        Find all matches for the currently hovered line
        and then loop through each match to find the one
        that is at the correct column of the cursor position
        */
        const matches = line.matchAll(VARIABLE_REGEX_GLOBAL)

        for (const match of Array.from(matches)) {
          if (match.index <= position.column && match[0].length >= position.column) {
            continue
          }

          /*
          Get the value for
          the matched variable
          */
          const variable = await bridge.variables.getVariable(match[1])
          
          return {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column + match[0].length
            ),
            contents: [
              { value: "**VALUE**" },
              {
                value: variable?.value ?? '*Not set*'
              }
            ]
          }
        }
      }
    })

    const editor = monaco.editor.create(elRef.current, {
      value: defaultValue,
      language: 'json',
      scrollbar: {
        verticalScrollbarSize: 5,
        horizontalScrollbarSize: 5
      },
      minimap: {
        enabled: false
      },
      scrollBeyondLastLine: false,
      lineDecorationsWidth: 5,
      lineNumbersMinChars: 3,
      colorDecorators: true,
      contextmenu: false,
      tabSize: 2
    })

    const model = editor.getModel()

    /*
    Keep a reference to
    the current model
    */
    modelRef.current = model

    model.onDidChangeContent(() => {
      onChange(model.getValue())
    })

    return () => {
      editor.dispose()
      modelRef.current = undefined
    }
  }, [])

  /*
  Update the model
  with new values
  */
  React.useEffect(() => {
    if (!modelRef.current) {
      return
    }
    if (value == null) {
      return
    }
    modelRef.current.setValue(value)
  }, [value])

  return (
    <div ref={elRef} className='Monaco' />
  )
}