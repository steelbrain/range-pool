/* @flow */

import invariant from 'assert'
import type { SerializedWorker } from './types'

export default class RangeWorker {
  status: boolean;
  startIndex: number;
  limitIndex: number;
  currentIndex: number;

  constructor(startIndex: number, limitIndex: number) {
    invariant(typeof startIndex === 'number', 'startIndex must be a number')
    invariant(typeof limitIndex === 'number', 'limitIndex must be a number')
    invariant(Number.isFinite(startIndex), 'startIndex must be finite')
    invariant(startIndex > -1, 'startIndex must be at least zero')
    invariant(limitIndex > startIndex, `limitIndex must be greater than startIndex, it was ${limitIndex === startIndex ? 'equal' : 'smaller'}`)

    this.status = false
    this.startIndex = startIndex
    this.limitIndex = limitIndex
    this.currentIndex = this.startIndex
  }
  advance(steps: number) {
    invariant(typeof steps === 'number', 'steps must be a number')
    invariant(steps > 0, 'steps must be more than zero')

    const remaining = this.getRemaining()
    if (steps > remaining) {
      throw new RangeError('Cannot advance worker more than maximum')
    }
    this.currentIndex += steps
  }
  setStatus(active: boolean): RangeWorker {
    this.status = !!active
    return this
  }
  getStatus(): boolean {
    return this.status
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
    if (this.limitIndex === Infinity) {
      return 0
    }

    return Math.round((this.getCompleted() / (this.limitIndex - this.startIndex)) * 100)
  }
  dispose() {
    this.status = false
  }
  serialize(): SerializedWorker {
    return {
      startIndex: this.startIndex,
      limitIndex: this.limitIndex,
      currentIndex: this.currentIndex,
    }
  }
  static unserialize(serialized: SerializedWorker): RangeWorker {
    const worker = new RangeWorker(serialized.startIndex, serialized.limitIndex)
    worker.currentIndex = serialized.currentIndex
    return worker
  }
}
