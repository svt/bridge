/**
 * @class DIBase
 * @description
 * A base class for objects registered
 * to the DIController, this will setup
 * props as the private #prop member
 */
class DIBase {
  props

  /**
   * Create a new instance of the DIBase class
   * and set props to the props member variable
   */
  constructor (props) {
    this.props = props
  }
}

module.exports = DIBase
