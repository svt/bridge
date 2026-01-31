import { PreferencesClearStateInput } from '../PreferencesClearStateInput'
import { PreferencesSegmentedInput } from '../PreferencesSegmentedInput'
import { PreferencesShortcutsInput } from '../PreferencesShortcutsInput'
import { PreferencesVersionInput } from '../PreferencesVersionInput'
import { PreferencesBooleanInput } from '../PreferencesBooleanInput'
import { PreferencesButtonInput } from '../PreferencesButtonInput'
import { PreferencesNumberInput } from '../PreferencesNumberInput'
import { PreferencesSelectInput } from '../PreferencesSelectInput'
import { PreferencesStringInput } from '../PreferencesStringInput'
import { PreferencesThemeInput } from '../PreferencesThemeInput'
import { PreferencesFrameInput } from '../PreferencesFrameInput'
import { PreferencesListInput } from '../PreferencesListInput'

/**
 * Map typenames to components
 * used to render the views
 * @type { Object.<String, React.Component> }
 */
export const inputComponents = {
  shortcuts: PreferencesShortcutsInput,
  segmented: PreferencesSegmentedInput,
  boolean: PreferencesBooleanInput,
  version: PreferencesVersionInput,
  button: PreferencesButtonInput,
  number: PreferencesNumberInput,
  select: PreferencesSelectInput,
  string: PreferencesStringInput,
  theme: PreferencesThemeInput,
  frame: PreferencesFrameInput,
  clear: PreferencesClearStateInput,
  list: PreferencesListInput
}
