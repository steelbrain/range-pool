# Range-Pool

[![Greenkeeper badge](https://badges.greenkeeper.io/steelbrain/range-pool.svg)](https://greenkeeper.io/)
Range-Pool is a base library for creating numeric range-based worker pools. It makes offset handling in distributed numeric operations easy.

For example, if you want to write a multi-connection download library that writes output from multiple requests to the same file, range-pool's index will make sure you get the correct position for each byte. Range-pool's API will also allow you to check which ranges are left so you can send http request with correct `Range` headers.

## Installation

```js
npm install --save range-pool
```

## API

```js
class RangePool {
  constructor(length: number | Infinity)
  getWorker(): RangeWorker
  hasAliveWorker(): boolean
  hasCompleted(): boolean
  getCompleted(): boolean
  getRemaining(): number
  getCompletionPercentage(): number
  dispose()
  serialize(): string
  static unserialize(serialized: string): RangePool
}
class RangeWorker {
  advance(steps: number)
  getStatus(): boolean
  setStatus(status: boolean): this
  getCurrentIndex(): number
  getStartIndex(): number
  getLimitIndex(): number
  getRemaining(): number
  getCompleted(): number
  hasCompleted(): boolean
  getCompletionPercentage(): number
  dispose()
}

export default RangePool
export { RangePool, RangeWorker }
```

## Example Usage

```js
'use babel'

import RangePool from 'range-pool'

const fileInfo: {
  size: number,
  url: string
} = getFileInfo()
const fd = getFileResource()

const range = new RangePool(fileInfo.size)
const firstWorker = range.getWorker()
const firstConnection = Connection.create(fileInfo.url)

firstConnection.on('data', function(chunk) {
  FS.write(fd, chunk, 0, chunk.length, firstWorker.getCurrentIndex(), e => console.log(e))
  firstWorker.advance(chunk.length)
})

const secondWorker = range.getWorker()
const secondConnection = Connection.create(fileInfo.url)

secondConnection.on('data', function(chunk) {
  FS.write(fd, chunk, 0, chunk.length, secondWorker.getCurrentIndex(), e => console.log(e))
  secondWorker.advance(chunk.length)
})
```

## License
This module is licensed under the terms of MIT License. Check the LICENSE file for more info.
