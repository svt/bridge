const bridge = require('bridge')

/*
The exported 'activate' function is the plugin's initialization function,
it will be called when the plugin is loaded and every time a workspace
is opened
*/
exports.activate = async () => {
  /*
  Listen for the item.play event to react to an item being played,
  the item's type-property can be used to perform the correct action

  The type 'plugin-custom-types.my-type' is in this case
  defined within the plugin's package.json file
  */
  bridge.events.on('item.play', item => {
    if (item?.type === 'plugin-custom-types.my-type') {
      // Perform action
      console.log('MY CUSTOM TYPE PLAYED')
    }
  })

  bridge.events.on('item.stop', item => {
    if (item?.type === 'plugin-custom-types.my-type') {
      // Perform action
      console.log('MY CUSTOM TYPE STOPPED')
    }
  })
}
