import { PreferencesShortcutsInput } from '../PreferencesShortcutsInput'
import { PreferencesVersionInput } from '../PreferencesVersionInput'
import { PreferencesBooleanInput } from '../PreferencesBooleanInput'
import { PreferencesStringInput } from '../PreferencesStringInput'
import { PreferencesNumberInput } from '../PreferencesNumberInput'
import { PreferencesSelectInput } from '../PreferencesSelectInput'
import { PreferencesThemeInput } from '../PreferencesThemeInput'
import { PreferencesFrameInput } from '../PreferencesFrameInput'

/**
 * Map typenames to components
 * used to render the views
 * @type { Object.<String, React.Component> }
 */
export const inputComponents = {
  shortcuts: PreferencesShortcutsInput,
  boolean: PreferencesBooleanInput,
  version: PreferencesVersionInput,
  string: PreferencesStringInput,
  number: PreferencesNumberInput,
  select: PreferencesSelectInput,
  theme: PreferencesThemeInput,
  frame: PreferencesFrameInput
}
