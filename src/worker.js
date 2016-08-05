/* @flow */

import invariant from 'assert'
import type { SerializedWorker } from './types'

export default class RangeWorker {
  active: boolean;
  startIndex: number;
  limitIndex: number;
  currentIndex: number;

  constructor(startIndex: number, limitIndex: number) {
    invariant(typeof startIndex === 'number', 'startIndex is not a number')
    invariant(typeof limitIndex === 'number', 'limitIndex is not a number')
    invariant(startIndex !== Infinity, 'startIndex should not be inifinite')
    invariant(startIndex > -1, 'startIndex should be at least zero')
    invariant(limitIndex > 0, 'limitIndex should be greater than zero')
    invariant((limitIndex - startIndex) > 0, 'startIndex and limitIndex difference should be more than zero')

    this.active = false
    this.startIndex = startIndex
    this.limitIndex = limitIndex
    this.currentIndex = this.startIndex
  }
  advance(steps: number) {
    const remaining = this.getRemaining()
    if (steps > remaining) {
      throw new RangeError('Cannot advance worker more than maximum')
    }
    this.currentIndex += steps
  }
  setActive(active: boolean): RangeWorker {
    this.active = !!active
    return this
  }
  getActive(): boolean {
    return this.active
  }
  getCurrentIndex(): number {
    return this.currentIndex
  }
  getStartIndex(): number {
    return this.startIndex
  }
  getLimitIndex(): number {
    return this.limitIndex
  }
  getRemaining(): number {
    return this.limitIndex - this.currentIndex
  }
  getCompleted(): number {
    return this.currentIndex - this.startIndex
  }
  hasCompleted(): boolean {
    return this.getRemaining() === 0
  }
  getCompletionPercentage(): number {
    return Math.round((this.getCompleted() / (this.limitIndex - this.startIndex)) * 100)
  }
  dispose() {
    this.active = false
  }
  serialize(): SerializedWorker {
    return {
      active: this.active,
      startIndex: this.startIndex,
      limitIndex: this.limitIndex,
      currentIndex: this.currentIndex,
    }
  }
  static unserialize(serialized: SerializedWorker): RangeWorker {
    const worker = new RangeWorker(serialized.startIndex, serialized.limitIndex)
    worker.active = serialized.active
    worker.currentIndex = serialized.currentIndex
    return worker
  }
}
