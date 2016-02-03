'use strict'

/* @flow */

import invariant from 'assert'

export class PoolWorker {
  startIndex: number;
  currentIndex: number;
  limitIndex: number;

  constructor(startIndex: number, limitIndex: number) {
    invariant(typeof startIndex === 'number', 'startIndex is not a number')
    invariant(typeof limitIndex === 'number', 'limitIndex is not a number')
    invariant(startIndex !== Infinity, 'startIndex should not be inifinite')
    invariant(startIndex > -1, 'startIndex should be at least zero')
    invariant(limitIndex > 0, 'limitIndex should be greater than zero')
    invariant(limitIndex - startIndex > 0, 'startIndex and limitIndex difference should be more than zero')

    this.startIndex = startIndex
    this.currentIndex = this.startIndex
    this.limitIndex = limitIndex
  }
  advance(steps: number) {
    const remaining = this.getRemaining()
    if (steps > remaining) {
      throw new Error('Cannot advance worker more than maximum')
    }
    this.currentIndex += steps
  }
  getCompletionPercentage(): number {
    return Math.round(((this.currentIndex - this.startIndex) / (this.limitIndex - this.startIndex)) * 100)
  }
  getRemaining(): number {
    return this.limitIndex - this.currentIndex
  }
  getCurrentIndex(): number {
    return this.currentIndex
  }
  hasCompleted(): boolean {
    return this.getRemaining() === 0
  }
  dispose() {
    this.limitIndex = this.currentIndex
  }
}
