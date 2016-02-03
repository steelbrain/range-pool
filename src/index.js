'use strict'

/* @flow */

import invariant from 'assert'
import {PoolWorker} from './worker'

export class RangePool {
  length: number;
  complete: bool;
  workers: Set<PoolWorker>;

  constructor(length: number) {
    invariant(typeof length === 'number', 'length is not a number')
    invariant(length !== Infinity, 'length can not be infinite')
    invariant(length > 0, 'length must be greater than zero')

    this.complete = false
    this.workers = new Set()
    this.length = length
  }
  createWorker(): PoolWorker {
    let lazyWorker = null
    let lazyPercentage = 101

    for (const worker of this.workers) {
      const percentage = worker.getCompletionPercentage()
      if (!worker.isComplete() && (percentage <= lazyPercentage)) {
        lazyWorker = worker
        lazyPercentage = percentage
      }
    }

    if (!lazyWorker) {
      if (this.isComplete()) {
        throw new Error('Can not add a new worker on a completed pool')
      }
      return this.registerWorker(new PoolWorker(this.getCompletedSteps(), this.length))
    }

    const workLeft = lazyWorker.getRemaining()
    const indexForNewWorker = (lazyWorker.currentIndex + workLeft / 2)
    const newWorker = new PoolWorker(indexForNewWorker, lazyWorker.limitIndex)
    lazyWorker.limitIndex = indexForNewWorker
    this.registerWorker(newWorker)
    return newWorker
  }
  isComplete(): boolean {
    return this.getCompletedSteps() === this.length
  }
  getCompletedSteps(): number {
    let completedSteps = 0
    for (const worker of this.workers) {
      completedSteps += worker.currentIndex - worker.startIndex
    }
    return completedSteps
  }
  getRemaining(): number {
    return this.length - this.getCompletedSteps()
  }
  // Private function registerWorker
  registerWorker(worker: PoolWorker): PoolWorker {
    this.workers.add(worker)
    return worker
  }
  dispose() {
    this.workers.clear()
  }
}
