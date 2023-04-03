import { PreferencesVersionInput } from '../PreferencesVersionInput'
import { PreferencesBooleanInput } from '../PreferencesBooleanInput'
import { PreferencesStringInput } from '../PreferencesStringInput'
import { PreferencesNumberInput } from '../PreferencesNumberInput'
import { PreferencesThemeInput } from '../PreferencesThemeInput'
import { PreferenceSelectInput } from '../PreferencesSelectInput'

/**
 * Map typenames to components
 * used to render the views
 * @type { Object.<String, React.Component> }
 */
export const inputComponents = {
  boolean: PreferencesBooleanInput,
  version: PreferencesVersionInput,
  string: PreferencesStringInput,
  number: PreferencesNumberInput,
  select: PreferenceSelectInput,
  theme: PreferencesThemeInput
}
