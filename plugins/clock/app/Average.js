/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

/**
 * @class Average
 * @description Calculate an average numerical
 *              value over a period of time
 */
export default class Average {
  /**
   * Create a new counter for the numerical average over a timespan
   * @param { Number } timespan The number of milliseconds
   *                            to store entries for
   */
  constructor (timespan = 5000) {
    this.timespan = timespan
    this.values = []
  }

  /**
   * Add a new value
   * to the list
   * @param { Number } value
   */
  add (value) {
    this.values.push({ time: Date.now(), value })
  }

  /**
   * Update the list of values
   * by deleting entries that
   * are too old
   */
  update () {
    const now = Date.now()
    /*
    Remove values that are too
    old to be included in the sum
    */
    this.values = this.values
      .filter(({ time }) => time > now - this.timespan)
  }

  /**
   * Get the average value
   * @returns { Number }
   */
  read () {
    this.update()

    let average = 0
    for (const { value } of this.values) {
      average += value
    }
    return average / this.values.length
  }
}
