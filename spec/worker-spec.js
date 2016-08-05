'use babel'

import RangeWorker from '../lib/worker'

describe('Pool Worker', function() {
  function getWorker(param1: any, param2: any): RangeWorker {
    return new RangeWorker(param1, param2)
  }

  it('cries if start index is not valid', function() {
    expect(function() {
      getWorker(null)
    }).toThrow()
    expect(function() {
      getWorker(Infinity)
    }).toThrow()
    expect(function() {
      getWorker(-1)
    }).toThrow()
    getWorker(0, 1)
  })

  it('cries if limitIndex is invalid', function() {
    expect(function() {
      getWorker(0, null)
    }).toThrow()
    expect(function() {
      getWorker(0, 0)
    }).toThrow()
    expect(function() {
      getWorker(5, 5)
    }).toThrow()
    getWorker(0, Infinity)
  })

  it('has a working advance method', function() {
    const worker = getWorker(0, 50)
    expect(worker.currentIndex).toBe(0)
    worker.advance(30)
    expect(worker.currentIndex).toBe(30)
    worker.advance(2)
    expect(worker.currentIndex).toBe(32)
    expect(function() {
      worker.advance(20)
    }).toThrow()
  })

  it('has a working setActive method', function() {
    const worker = getWorker(0, 50)
    worker.setActive(null)
    expect(worker.getActive()).toBe(false)
    worker.setActive(1)
    expect(worker.getActive()).toBe(true)
    worker.setActive('asdasd')
    expect(worker.getActive()).toBe(true)
  })

  it('has a working getCompletionPercentage method', function() {
    const worker = getWorker(50, 100)
    expect(worker.getCompletionPercentage()).toBe(0)
    worker.advance(5)
    expect(worker.getCompletionPercentage()).toBe(10)
    worker.advance(10)
    expect(worker.getCompletionPercentage()).toBe(30)
    worker.advance(35)
    expect(worker.getCompletionPercentage()).toBe(100)
  })

  it('has a valid getRemaining method', function() {
    const worker = getWorker(50, 100)
    expect(worker.getRemaining()).toBe(50)
    worker.advance(10)
    expect(worker.getRemaining()).toBe(40)
    worker.advance(30)
    expect(worker.getRemaining()).toBe(10)
    worker.advance(10)
    expect(worker.getRemaining()).toBe(0)
  })

  it('has a valid hasCompleted method', function() {
    const worker = getWorker(50, 100)
    expect(worker.hasCompleted()).toBe(false)
    worker.advance(50)
    expect(worker.hasCompleted()).toBe(true)
  })

  it('has an active state', function() {
    const worker = getWorker(50, Infinity)
    expect(worker.getActive()).toBe(false)
    worker.setActive(true)
    expect(worker.getActive()).toBe(true)
    worker.dispose()
    expect(worker.getActive()).toBe(false)
    worker.setActive(true)
    expect(worker.getActive()).toBe(true)
    worker.dispose()
    expect(worker.getActive()).toBe(false)
    worker.setActive(true)
    expect(worker.getActive()).toBe(true)
    worker.dispose()
    expect(worker.getActive()).toBe(false)
  })

  it('is serializable', function() {
    const worker = getWorker(50, 100)
    worker.advance(10)
    const cloneWorker = RangeWorker.unserialize(worker.serialize())
    expect(worker).toEqual(cloneWorker)
  })
})
