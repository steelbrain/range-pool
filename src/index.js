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
    let lazyDiff = 0
    let lazyPercentage = 101
    let lastWorker = null

    for (const worker of this.workers) {
      if (!worker.hasCompleted()) {
        if (!worker.isActive()) {
          return worker.activate()
        }

        const percentage = worker.getCompletionPercentage()
        const diff = worker.getIndexLimit() - worker.getCurrentIndex()
        lastWorker = worker
        if (percentage < lazyPercentage) {
          lazyWorker = worker
          lazyPercentage = percentage
          lazyDiff = diff
        } else if (lazyDiff < diff) {
          lazyWorker = worker
          lazyPercentage = percentage
          lazyDiff = diff
        }
      }
    }

    if (!lazyWorker) {
      if (this.hasCompleted()) {
        throw new Error('Can not add a new worker on a completed pool')
      }
      return this.registerWorker(new PoolWorker(this.getCompletedSteps(), this.length)).activate()
    }

    const workLeft = lazyWorker.getRemaining()
    const indexForNewWorker = Math.ceil(lazyWorker.currentIndex + workLeft / 2)
    const newWorker = new PoolWorker(indexForNewWorker, lazyWorker.limitIndex)
    lazyWorker.limitIndex = indexForNewWorker
    return this.registerWorker(newWorker).activate()
  }
  hasCompleted(): boolean {
    return this.getCompletedSteps() === this.length
  }
  hasWorkingWorker(): boolean {
    for (const worker of this.workers) {
      if (!worker.hasCompleted() && worker.isActive()) {
        return true
      }
    }
    return false
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
