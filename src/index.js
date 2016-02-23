'use strict'

/* @flow */

import invariant from 'assert'
import {PoolWorker} from './worker'
import type {PoolWorker$Serialized} from './worker'

type RangePool$Serialized = {
  length: number,
  complete: boolean,
  workers: Array<PoolWorker$Serialized>
}

export class RangePool {
  length: number;
  complete: bool;
  workers: Set<PoolWorker>;

  constructor(length: number) {
    invariant(typeof length === 'number', 'length is not a number')
    invariant(length !== Infinity, 'length can not be infinite')
    invariant(length > 0, 'length must be greater than zero')

    this.length = length
    this.complete = false
    this.workers = new Set()
  }
  serialize(): RangePool$Serialized {
    const workers = []
    for (const worker of this.workers) {
      workers.push(worker.serialize())
    }
    return {
      length: this.length,
      complete: this.complete,
      workers: workers
    }
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
  getWorkingWorker(): ?PoolWorker {
    for (const worker of this.workers) {
      if (!worker.hasCompleted() && worker.isActive()) {
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
  static unserialize(serialized: RangePool$Serialized): RangePool {
    const pool = new RangePool(serialized.length)
    pool.complete = serialized.complete
    for (const worker of serialized.workers) {
      pool.workers.add(PoolWorker.unserialize(worker))
    }
    return pool
  }
}
