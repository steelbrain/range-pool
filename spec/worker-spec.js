'use babel'

import {PoolWorker} from '../lib/worker'

describe('Pool Worker', function() {
  it('cries if start index is not valid', function() {
    expect(function() {
      new PoolWorker(null)
    }).toThrow()
    expect(function() {
      new PoolWorker(Infinity)
    }).toThrow()
    expect(function() {
      new PoolWorker(-1)
    }).toThrow()
    new PoolWorker(0, 1)
  })

  it('cries if limitIndex is invalid', function() {
    expect(function() {
      new PoolWorker(0, null)
    }).toThrow()
    expect(function() {
      new PoolWorker(0, 0)
    }).toThrow()
    expect(function() {
      new PoolWorker(5, 5)
    }).toThrow()
    new PoolWorker(0, Infinity)
  })

  it('has a working advance method', function() {
    const worker = new PoolWorker(0, 50)
    expect(worker.currentIndex).toBe(0)
    worker.advance(30)
    expect(worker.currentIndex).toBe(30)
    worker.advance(2)
    expect(worker.currentIndex).toBe(32)
    expect(function() {
      worker.advance(20)
    }).toThrow()
  })

  it('has a working getCompletionPercentage method', function() {
    const worker = new PoolWorker(50, 100)
    expect(worker.getCompletionPercentage()).toBe(0)
    worker.advance(5)
    expect(worker.getCompletionPercentage()).toBe(10)
    worker.advance(10)
    expect(worker.getCompletionPercentage()).toBe(30)
    worker.advance(35)
    expect(worker.getCompletionPercentage()).toBe(100)
  })

  it('has a valid getRemaining method', function() {
    const worker = new PoolWorker(50, 100)
    expect(worker.getRemaining()).toBe(50)
    worker.advance(10)
    expect(worker.getRemaining()).toBe(40)
    worker.advance(30)
    expect(worker.getRemaining()).toBe(10)
    worker.advance(10)
    expect(worker.getRemaining()).toBe(0)
  })

  it('has a valid hasCompleted method', function() {
    const worker = new PoolWorker(50, 100)
    expect(worker.hasCompleted()).toBe(false)
    worker.advance(50)
    expect(worker.hasCompleted()).toBe(true)
  })

  it('has an active state', function() {
    const worker = new PoolWorker(50, Infinity)
    expect(worker.isActive()).toBe(false)
    worker.activate()
    expect(worker.isActive()).toBe(true)
    worker.dispose()
    expect(worker.isActive()).toBe(false)
    worker.activate()
    expect(worker.isActive()).toBe(true)
    worker.dispose()
    expect(worker.isActive()).toBe(false)
    worker.activate()
    expect(worker.isActive()).toBe(true)
    worker.dispose()
    expect(worker.isActive()).toBe(false)
  })

  it('is serializable', function() {
    const worker = new PoolWorker(50, 100)
    worker.advance(10)
    const cloneWorker = PoolWorker.unserialize(worker.serialize())
    expect(worker).toEqual(cloneWorker)
  })
})
