# Range-Pool
Range-Pool is a base library for creating numeric range-based worker pools. It makes offset handling in distributed numeric operations easy.

For example, if you want to write a multi-connection download library that writes output from multiple requests to the same file, range-pool's index will make sure you get the correct position for each byte. Range-pool's API will also allow you to check which ranges are left so you can send http request with correct `Range` headers.

## Installation

```js
npm install --save range-pool
```

## API

```js
export class RangePool {
  constructor(length: number | Infinity)
  createWorker(): PoolWorker
  hasCompleted(): boolean
  hasWorkingWorker(): boolean
  getCompletedSteps(): boolean
  getRemaining(): number // out of length
  dispose()
}
class PoolWorker {
  advance(steps: number)
  getCompletionPercentage(): number
  getRemaining(): number
  getCurrentIndex(): number
  getIndexLimit(): number
  hasCompleted(): boolean
  dispose()
}
```

## Example Usage

```js
'use babel'

import {RangePool} from 'range-pool'

const fileInfo: {
  size: number,
  url: string
} = getFileInfo()
const fd = getFileResource()

const range = new RangePool(fileInfo.size)
const firstWorker = range.createWorker()
const firstConnection = Connection.create(fileInfo.url)

firstConnection.on('data', function(chunk) {
  FS.write(fd, chunk, 0, chunk.length, firstWorker.getCurrentIndex(), e => console.log(e))
  firstWorker.advance(chunk.length)
})

const secondWorker = range.createWorker()
const secondConnection = Connection.create(fileInfo.url)

secondConnection.on('data', function(chunk) {
  FS.write(fd, chunk, 0, chunk.length, secondWorker.getCurrentIndex(), e => console.log(e))
  secondWorker.advance(chunk.length)
})
```

## License
This module is licensed under the terms of MIT License. Check the LICENSE file for more info.
