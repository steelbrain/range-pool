'use babel'

import {RangePool} from '../'
console = require('console')

describe('RangePool', function() {
  it('cries when constructor param is inifinite', function() {
    expect(function() {
      new RangePool(Infinity)
    }).toThrow()
  })
  it('cries when constructor param is negative', function() {
    expect(function() {
      new RangePool(-1)
    }).toThrow()
  })
  it('accepts a number', function() {
    const pool = new RangePool(50)
    expect(pool).toBeDefined()
  })

  it('can divide a workaround in a lot of workers', function() {
    const pool = new RangePool(500)
    let i =0
    for (i = 0; i < 10; i++) {
      pool.createWorker()
    }
  })
  it('cries if we try to create a worker on a completed pool', function() {
    const pool = new RangePool(500)
    const worker = pool.createWorker()
    worker.advance(500)
    expect(function() {
      pool.createWorker()
    }).toThrow()
  })
  it('has a working hasCompleted method', function() {
    const pool = new RangePool(500)
    const worker = pool.createWorker()
    expect(pool.hasCompleted()).toBe(false)
    worker.advance(500)
    expect(pool.hasCompleted()).toBe(true)
  })
  it('has a working getCompletedSteps method', function() {
    const pool = new RangePool(500)
    expect(pool.getCompletedSteps()).toBe(0)
    const worker = pool.createWorker()
    expect(pool.getCompletedSteps()).toBe(0)
    worker.advance(50)
    expect(pool.getCompletedSteps()).toBe(50)
  })
  it('has a working getRemaining method', function() {
    const pool = new RangePool(500)
    expect(pool.getRemaining()).toBe(500)
    const worker = pool.createWorker()
    expect(pool.getRemaining()).toBe(500)
    worker.advance(100)
    expect(pool.getRemaining()).toBe(400)
  })

  it('properly distributes work among workers', function() {
    const pool = new RangePool(512)
    const workerFirst = pool.createWorker()
    expect(pool.getCompletedSteps()).toBe(0)
    workerFirst.advance(256)
    expect(pool.getCompletedSteps()).toBe(256)
    const workerSecond = pool.createWorker()
    expect(workerFirst.limitIndex).toBe(384)
    expect(workerFirst.currentIndex).toBe(256)
    expect(workerSecond.startIndex).toBe(384)
    expect(workerSecond.currentIndex).toBe(384)
    expect(workerSecond.limitIndex).toBe(512)
    expect(pool.getCompletedSteps()).toBe(256)
    workerSecond.advance(128)
    expect(pool.getCompletedSteps()).toBe(384)
  })

  it('properly distributes work among more than two workers', function() {
    const pool = new RangePool(1024)
    const workerFirst = pool.createWorker()
    workerFirst.advance(128)
    const workerSecond = pool.createWorker()
    workerSecond.advance(100)
    const workerThird = pool.createWorker()
    expect(pool.getCompletedSteps()).toBe(228)

    let range = 0
    range += workerFirst.getIndexLimit() - workerFirst.getStartIndex()
    range += workerSecond.getIndexLimit() - workerSecond.getStartIndex()
    range += workerThird.getIndexLimit() - workerThird.getStartIndex()
    expect(range).toBe(1024)
  })

  it('properly distributes work of odd length', function() {
    const pool = new RangePool(999)
    const workerFirst = pool.createWorker()
    workerFirst.advance(50)
    const workerSecond = pool.createWorker()
    expect(workerFirst.limitIndex).toBe(525)
    expect(workerSecond.startIndex).toBe(525)
    expect(workerSecond.limitIndex).toBe(999)
  })

  it('re-uses old unfinished died workers even if that means one', function() {
    const pool = new RangePool(90)
    const workerA = pool.createWorker()
    workerA.advance(50)
    workerA.dispose()
    expect(workerA.isActive()).toBe(false)
    const workerB = pool.createWorker()
    expect(workerA).toBe(workerB)
    expect(workerB.isActive()).toBe(true)
  })

  it('re-uses old unfinished died workers no matter how many', function() {
    const pool = new RangePool(50)
    const workerA = pool.createWorker()
    workerA.advance(5)
    const workerB = pool.createWorker()
    workerB.advance(5)
    const workerC = pool.createWorker()
    expect(workerC.isActive()).toBe(true)
    workerC.dispose()
    expect(workerC.isActive()).toBe(false)
    const workerD = pool.createWorker()
    expect(workerD).toBe(workerC)
    expect(workerD.isActive()).toBe(true)
    expect(workerC.isActive()).toBe(true)
  })

  it('is serializable', function() {
    const pool = new RangePool(50)
    const workerA = pool.createWorker()
    workerA.advance(5)
    const workerB = pool.createWorker()
    workerB.advance(5)

    const poolClone = RangePool.unserialize(pool.serialize())
    expect(pool.length).toEqual(poolClone.length)
    expect(pool.complete).toEqual(poolClone.complete)
    expect([...pool.workers]).toEqual([...poolClone.workers])
  })
})
