/* @flow */

import invariant from 'assert'
import RangeWorker from './worker'

export default class RangePool {
  length: number;
  workers: Set<RangeWorker>;

  constructor(length: number) {
    invariant(typeof length === 'number', 'length is not a number')
    invariant(Number.isFinite(length), 'length can not be infinite')
    invariant(length > 0, 'length must be greater than zero')

    this.length = length
    this.workers = new Set()
  }
  hasAliveWorker(): boolean {
    for (const worker of this.workers) {
      if (!worker.hasCompleted() && worker.getActive()) {
        return true
      }
    }
    return false
  }
  getWorker(): ?RangeWorker {
    if (this.hasCompleted()) {
      throw new Error('Can not add a new worker on a completed pool')
    }
    if (!this.workers.size) {
      const worker = new RangeWorker(0, this.length)
      this.workers.add(worker)
      return worker.setActive(true)
    }

    let lazy: ?RangeWorker = null

    for (const worker of this.workers) {
      if (worker.hasCompleted()) {
        continue
      }
      if (!worker.getActive()) {
        return worker.setActive(true)
      }
      if (!lazy || worker.getCompletionPercentage() < lazy.getCompletionPercentage() || worker.getRemaining() > lazy.getRemaining()) {
        lazy = worker
      }
    }

    invariant(lazy, 'No lazy worker found?!')
    const workLeft = lazy.getRemaining()
    const indexForNewWorker = Math.ceil(lazy.currentIndex + (workLeft / 2))
    const newWorker = new RangeWorker(indexForNewWorker, lazy.limitIndex)
    this.workers.add(newWorker)
    lazy.limitIndex = indexForNewWorker
    return newWorker.setActive(true)
  }
  getCompleted(): number {
    let completedSteps = 0
    for (const worker of this.workers) {
      completedSteps += worker.getCompleted()
    }
    return completedSteps
  }
  getRemaining(): number {
    return this.length - this.getCompleted()
  }
  hasCompleted(): boolean {
    return this.getCompleted() === this.length
  }
  getCompletionPercentage(): number {
    if (!Number.isFinite(this.length)) {
      return 0
    }
    return Math.round((this.getCompleted() / this.getRemaining()) * 100)
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
      pool.workers.add(RangeWorker.unserialize(unserialized.workers[i]))
    }
    return pool
  }
}

export { RangeWorker, RangePool }
