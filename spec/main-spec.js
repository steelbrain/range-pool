'use babel'

import RangePool from '../'

describe('RangePool', function() {
  function getRangePool(limit: number): RangePool {
    return new RangePool(limit)
  }

  it('cries when constructor param is negative', function() {
    expect(function() {
      getRangePool(-1)
    }).toThrow()
  })
  it('accepts a number', function() {
    const pool = getRangePool(50)
    expect(pool).toBeDefined()
  })

  it('can divide a workload in a lot of workers', function() {
    const pool = getRangePool(500)
    let i = 0
    for (i = 0; i < 10; i++) {
      pool.getWorker()
    }
    let total = 0
    pool.workers.forEach(function(worker) {
      total += worker.limitIndex - worker.startIndex
    })
    expect(total).toBe(500)
  })
  it('cries if we try to create a worker on a completed pool', function() {
    const pool = getRangePool(500)
    pool.getWorker().advance(500)
    expect(function() {
      pool.getWorker()
    }).toThrow()
  })
  it('has a working hasCompleted method', function() {
    const pool = getRangePool(500)
    const worker = pool.getWorker()
    expect(pool.hasCompleted()).toBe(false)
    worker.advance(500)
    expect(pool.hasCompleted()).toBe(true)
  })
  it('has a working getCompleted method', function() {
    const pool = getRangePool(500)
    expect(pool.getCompleted()).toBe(0)
    const worker = pool.getWorker()
    expect(pool.getCompleted()).toBe(0)
    worker.advance(50)
    expect(pool.getCompleted()).toBe(50)
  })
  it('has a working getRemaining method', function() {
    const pool = getRangePool(500)
    expect(pool.getRemaining()).toBe(500)
    const worker = pool.getWorker()
    expect(pool.getRemaining()).toBe(500)
    worker.advance(100)
    expect(pool.getRemaining()).toBe(400)
  })

  it('properly distributes work among workers', function() {
    const pool = getRangePool(512)
    const workerFirst = pool.getWorker()
    expect(pool.getCompleted()).toBe(0)
    workerFirst.advance(256)
    expect(pool.getCompleted()).toBe(256)
    const workerSecond = pool.getWorker()
    expect(workerFirst.limitIndex).toBe(384)
    expect(workerFirst.currentIndex).toBe(256)
    expect(workerSecond.startIndex).toBe(384)
    expect(workerSecond.currentIndex).toBe(384)
    expect(workerSecond.limitIndex).toBe(512)
    expect(pool.getCompleted()).toBe(256)
    workerSecond.advance(128)
    expect(pool.getCompleted()).toBe(384)
  })

  it('properly distributes work among more than two workers', function() {
    const pool = getRangePool(1024)
    const workerFirst = pool.getWorker()
    workerFirst.advance(128)
    const workerSecond = pool.getWorker()
    workerSecond.advance(100)
    const workerThird = pool.getWorker()
    expect(pool.getCompleted()).toBe(228)

    let range = 0
    range += workerFirst.getLimitIndex() - workerFirst.getStartIndex()
    range += workerSecond.getLimitIndex() - workerSecond.getStartIndex()
    range += workerThird.getLimitIndex() - workerThird.getStartIndex()
    expect(range).toBe(1024)
  })

  it('properly distributes work of odd length', function() {
    const pool = getRangePool(999)
    const workerFirst = pool.getWorker()
    workerFirst.advance(50)
    const workerSecond = pool.getWorker()
    expect(workerFirst.limitIndex).toBe(525)
    expect(workerSecond.startIndex).toBe(525)
    expect(workerSecond.limitIndex).toBe(999)
  })

  it('re-uses old unfinished died workers even if that means one', function() {
    const pool = getRangePool(90)
    const workerA = pool.getWorker()
    workerA.advance(50)
    workerA.dispose()
    expect(workerA.getActive()).toBe(false)
    const workerB = pool.getWorker()
    expect(workerA).toBe(workerB)
    expect(workerB.getActive()).toBe(true)
  })

  it('re-uses old unfinished died workers no matter how many', function() {
    const pool = getRangePool(50)
    const workerA = pool.getWorker()
    workerA.advance(5)
    const workerB = pool.getWorker()
    workerB.advance(5)
    const workerC = pool.getWorker()
    expect(workerC.getActive()).toBe(true)
    workerC.dispose()
    expect(workerC.getActive()).toBe(false)
    const workerD = pool.getWorker()
    expect(workerD).toBe(workerC)
    expect(workerD.getActive()).toBe(true)
    expect(workerC.getActive()).toBe(true)
  })

  it('throws an error if limit is infinity and we try to make more than one workers', function() {
    const pool = getRangePool(Infinity)
    let firstWorker
    let secondWorker
    expect(function() {
      firstWorker = pool.getWorker()
    }).not.toThrow()
    expect(function() {
      secondWorker = pool.getWorker()
    }).toThrow()
    firstWorker.dispose()
    expect(function() {
      secondWorker = pool.getWorker()
    }).not.toThrow()
    expect(firstWorker).toBe(secondWorker)
  })

  it('is serializable', function() {
    const pool = getRangePool(50)
    const workerA = pool.getWorker()
    workerA.advance(5)
    const workerB = pool.getWorker()
    workerB.advance(5)

    const poolClone = RangePool.unserialize(pool.serialize())
    poolClone.workers.forEach(worker => worker.setStatus(true))
    expect(pool.length).toEqual(poolClone.length)
    expect(pool.hasCompleted()).toEqual(poolClone.hasCompleted())
    expect([...pool.workers]).toEqual([...poolClone.workers])
  })

  it('serializes infinities', function() {
    const pool = getRangePool(Infinity)
    pool.getWorker()
    const anotherPool = RangePool.unserialize(pool.serialize())
    expect(anotherPool.workers.size).toBe(1)
    anotherPool.workers.forEach(function(item) {
      expect(item.limitIndex).toBe(Infinity)
    })
  })
})
