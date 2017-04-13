/* @flow */

import invariant from 'assert'
import RangeWorker from './worker'

export default class RangePool {
  length: number;
  workers: Set<RangeWorker>;
  metadata: Object;

  constructor(length: number) {
    invariant(typeof length === 'number', 'length is not a number')
    invariant(length > 0, 'length must be greater than zero')

    this.length = length
    this.workers = new Set()
    this.metadata = {}
  }
  getMetadata(): Object {
    return this.metadata
  }
  setMetadata(metadata: Object): void {
    invariant(metadata && typeof metadata === 'object', 'metadata must be an object')

    this.metadata = metadata
  }
  hasAliveWorker(): boolean {
    for (const worker of this.workers) {
      if (!worker.hasCompleted() && worker.getStatus()) {
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
      worker.setStatus(true)
      return worker
    }

    let lazy: ?RangeWorker = null

    for (const entry of this.workers) {
      if (entry.hasCompleted()) {
        continue
      }
      if (!entry.getStatus()) {
        entry.setStatus(true)
        return entry
      }
      if (!lazy || entry.getRemaining() > lazy.getRemaining()) {
        lazy = entry
      }
    }

    invariant(lazy, 'No lazy worker found?!')
    if (lazy.limitIndex === Infinity) {
      throw new Error('Refusing to create more than one worker for Infinite length')
    }

    const lazyLimit = lazy.limitIndex
    const lazyCurrent = lazy.currentIndex
    const lazyWorkHalf = Math.ceil(lazyCurrent + ((lazyLimit - lazyCurrent) / 2))

    lazy.limitIndex = lazyWorkHalf

    const worker = new RangeWorker(lazyWorkHalf, lazyLimit)
    this.workers.add(worker)
    worker.setStatus(true)
    return worker
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
    if (this.length === Infinity) {
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
      return value === Infinity ? '$$SB_Infinity$$' : value
    })
  }
  static unserialize(serialized: string): RangePool {
    invariant(typeof serialized === 'string', 'Serialized content must be a string')

    const unserialized = JSON.parse(serialized, function(key: string, value: any) {
      return value === '$$SB_Infinity$$' ? Infinity : value
    })
    const pool = new RangePool(unserialized.length)
    unserialized.workers.forEach(function(entry) {
      pool.workers.add(RangeWorker.unserialize(entry))
    })
    return pool
  }
}

export { RangeWorker, RangePool }
