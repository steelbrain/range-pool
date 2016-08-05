/* @flow */

import invariant from 'assert'
import PoolWorker from './worker'

export default class RangePool {
  length: number;
  workers: Set<PoolWorker>;

  constructor(length: number) {
    invariant(typeof length === 'number', 'length is not a number')
    invariant(Number.isFinite(length), 'length can not be infinite')
    invariant(length > 0, 'length must be greater than zero')

    this.length = length
    this.workers = new Set()
  }
  createWorker(): PoolWorker {
    let lazyWorker = null
    let lazyDiff = 0
    let lazyPercentage = 101

    for (const worker of this.workers) {
      if (!worker.hasCompleted()) {
        if (!worker.getActive()) {
          return worker.setActive(true)
        }

        const percentage = worker.getCompletionPercentage()
        const diff = worker.getLimitIndex() - worker.getCurrentIndex()
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
      return this.registerWorker(new PoolWorker(this.getCompletedSteps(), this.length)).setActive(true)
    }

    const workLeft = lazyWorker.getRemaining()
    const indexForNewWorker = Math.ceil(lazyWorker.currentIndex + (workLeft / 2))
    const newWorker = new PoolWorker(indexForNewWorker, lazyWorker.limitIndex)
    lazyWorker.limitIndex = indexForNewWorker
    return this.registerWorker(newWorker).setActive(true)
  }
  hasCompleted(): boolean {
    return this.getCompletedSteps() === this.length
  }
  getWorkingWorker(): ?PoolWorker {
    for (const worker of this.workers) {
      if (!worker.hasCompleted() && worker.setActive(true)) {
        return worker
      }
    }
    return null
  }
  hasWorkingWorker(): boolean {
    return this.getWorkingWorker() !== null
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
  serialize(): string {
    const workers = []
    for (const worker of this.workers) {
      workers.push(worker.serialize())
    }
    return JSON.stringify({
      length: this.length,
      workers,
    }, function(key: string, value: any) {
      return value === Infinity ? 'Infinity' : value
    })
  }
  static unserialize(serialized: string): RangePool {
    invariant(typeof serialized === 'string', 'Serialized content must be a string')

    const unserialized = JSON.parse(serialized, function(key: string, value: any) {
      return value === 'Infinity' ? Infinity : value
    })
    const pool = new RangePool(unserialized.length)
    for (let i = 0, length = unserialized.workers.length; i < length; ++i) {
      pool.workers.add(PoolWorker.unserialize(unserialized.workers[i]))
    }
    return pool
  }
}
