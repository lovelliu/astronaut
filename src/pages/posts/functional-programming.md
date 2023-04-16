---
layout: ../../layouts/PostLayout.astro
title: 函数式编程
author: Lovell Liu
date: 2022-5-2
---

## TOC

**函数式编程是一种编程范式，主要是利用函数把运算过程封装起来，通过组合各种函数来计算结果。**

## 1. 高阶函数（Higher-order function）

高阶函数一大特性是将函数作为参数，以下模拟数组的高阶函数。

```javascript
// forEach
function forEach(arr, fn) {
  for(let val of arr) {
    fn(val);
  }
}

// filter
function filter(arr, fn) {
  let result = [];
  for(let val of arr) {
    if (fn(val)) {
      result.push(val);
    }
  }
  
  return result;
}

// map
function map(arr, fn) => {
  let result = [];
  for(let val of arr) {
    result.push(fn(val));
  }
  return result;
}

// every
function every(arr, fn) {
  for(let val of arr) {
    result = fn(val);
    if (!result) {
      return false;
    }
  }
  return true;
}

// some
function some(arr, fn) {
  for(let val of arr) {
    result = fn(val);
    if (result) {
      return true;
    }
  }
  return false;
}
```

函数作为返回值

```javascript
// once函数
function once(fn) {
  let done = false;
  let ret;
  return (...args) => {
    if (done) return ret;
    done = true;
    ret = fn.apply(null, args);
    return ret;  
  }
}

const pay = once((money) => {
  console.log(money);
})

pay(5); // 5
pay(2); // 不再执行
pay(3);
```

使用高阶函数的意义

- 抽象可以帮我们屏蔽细节，只需要关注于我们所要实现的目标
- 高阶函数是用来抽象通用的问题，比如 filter 高阶函数是将数组中符合条件的每一项给筛选出来，所以可以把解决这一问题的函数抽象为**过滤器**。
- 代码简洁

## 2. 纯函数(Pure functions)

概念：相同的输入永远会得到相同的输出，而且没有任何可观察的副作用。

纯函数就类似于数学中的函数(用来描述输入与输出之间的关系)，例如**y = f(x)**。

比如：

```javascript
let arr = [1, 3, 5, 7];

console.log(arr.slice(0, 2)) // [1,3]
console.log(arr.slice(0, 2)) // [1,3]
console.log(arr.slice(0, 2)) // [1,3]

console.log(arr.splice(0, 2)) // [1, 3]
console.log(arr.splice(0, 2)) // [5, 7]
console.log(arr.splice(0, 2)) // []
```

上述中 slice 函数返回的值永远相同为纯函数，相反 splice 则不是纯函数。

纯函数的优势：

1. 对纯函数的结果进行缓存

```javascript
// 记忆函数(模拟 lodash 中 memoize 方法)
// const _ = require('lodash');

// function getArea(r) {
//  return Math.PI * r * r;
// }

//let getAreaWithMemory = _.memoize(getArea);

function memoize(fn) {
  let cache = {};
  
  return function() {
    let key = JSON.stringify(arguments);
    cache[key] = cache[key] || fn.apply(fn, arguments)
    return cache[key];
  }
}
```

2. 可测试(测试更加方便)
3. 并行处理：在多线程环境下并行操作共享的内存数据很可能会出现意外情况，而纯函数不需要访问共享的内存数据，所以在并行环境下可以任意执行纯函数。

## 3. 副作用(Side Effect)

副作用让一个函数变得不纯，如果函数依赖于外部全局变量就无法保证输出相同，副作用由此出现。

副作用无法完全禁止，所有的外部交互都有可能代理副作用，所以要尽可能控制它们在可控范围内发生。

## 4. 柯里化(Currying)

函数有多个参数时先传部分参数，然后返回新的函数并将剩余的参数作为该函数的参数这一过程称为函数的柯里化。

```javascript
// 避免重复参数的多次传入
function checkAge(min) {
  return function(age) {
    return age >= min;
  }
}

// es6写法
const checkAge = (min) => (age => age >= min);

let checkAge18 = checkAge(18);
let checkAge20 = checkAge(20);

checkAge18(20);
checkAge20(24);


// 判断类型
function isType(type) {
  return function(obj) {
    return Object.toString.call(obj) === `[object ${type}]`
  }
}

const isArray = isType('Array')
const isObj = isType('Object')


// 模拟 bind 方法
Function.prototype.bind = function (context, ...args) {
  return (...rest) => this.call(context, ...args, ...rest)
}
```

lodash中curry

```javascript
const _ = require('lodash');
function getSum(a, b, c) {
	return a + b + c;
}
const curried = _.curry(getSum);
console.log(curried(1)(2, 3)); // 6
console.log(curried(2, 3)(1)); // 6
```

模拟 lodash 的curry

```javascript
function curry(fn) {
  return function curriedFn(...args) {
    // 判断实参和形参的个数
    if (args.length < fn.length) {
      return function() {
        return curriedFn(...args.concat(Array.from(arguments)));
      }
    }
    return fn(...args)
  }
}
```

柯里化的特性：

- 柯里化可以让我们给一个函数传递较少的参数得到一个已经记住了某些固定参数的新函数。
- 是一种对函数的缓存
- 让函数变得更灵活，让函数的粒度更小
- 可以把多元函数转换成一元函数，可以组合使用函数产生强大的功能

## 5. 函数组合(Compose)

由于纯函数和柯里化很容易写出洋葱代码，如：h(g(f(x)))。

而函数组合可以让我们把细粒度的函数重新组合成一个新的函数。

```javascript
function compose(...args) {
  return function(value) {
    return args.reverse().reduce(function(acc, fn){
      return fn(acc);
    }, value);
  }
}

// es6简化代码
const compose = (...args) => (value) => args.reverse().reduce((acc, fn) => fn(acc), value);	

function reverse(arr) {
  return arr.reverse();
}

function first(arr) {
  return arr[0];
}

// 求数组中的最后一个元素
const last = compose(first, reverse);
console.log(last([1, 2, 3, 4])) // 4
```

注：`函数组合要满足结合律`

函数组合调试

```javascript
// NEVER SAY DIE => never-say-die
const _ = require('lodash');

const split = _.curry((sep, str) => _.split(str, sep));

const join = _.curry((sep, arr) => _.join(arr, sep));

const f = _.flowRight(join('-'), _.toLower, split(' '));

console.log(f('NEVER SAY DIE')); // 此时未得到相应结果

// 调试: 组合函数中的每个函数执行后的结果都会返回给下一个函数
const trace = _.curry((tag, val) => {
  console.log(tag, val);
  return val;
})
const f = _.flowRight(join('-'), _.toLower, trace('split之前'), split(' ')); // toLower将数组转换成字符串，所以要借助 map 方法对数组的每一项单独处理
```

lodash中的`fp`模块(函数友好式编程)提供的方法已进行柯里化处理，并且遵循**函数优先，数据其后**的原则，使用`fp`模块的方法可以简化上述代码。

lodash的 map 方法会给传过来的函数三个参数：数组项、数组项索引以及该数组，而`fp`模块只传递数组项这一个函数。

## 6. Point Free

概念：把数据处理的过程定义成与数据无关的合成运算，不需要用到代表数据的那个参数，只把简单的运算步骤合成到一起，在使用这种模式前我们需要定义一些辅助的基本运算函数。

比如合成函数：`const f = compose(fn1, fn2)`，这个过程把基本运算合成一个函数，并没有传递数据，这个模式为**Point Free**。

使用Point Free模式处理：

```javascript
// Hello    World => hello-world

const fp = require('lodash/fp');
const f = fp.flowRight(fp.replace(/\s+/g, '-'), fp.toLower);

console.log(f('Hello    World'))
```

## 7. 函子(Functor)

概念：包含值与值的变形关系(函数)称为**容器**， 而函子就是一个特殊的容器，通过一个普通的对象来实现，该对象具有 map 方法，map方法可以运行一个函数对值进行处理(变形关系)

作用：函子可以控制副作用以及异常处理异常操作

```javascript
class Container {
  static of(value) {
		return new Container(value);
  }
  constructor(value) {
    // _value为该容器单独维护的一个值
    this._value = value;
  }
  
  map(fn) {
    return new Container(fn(this._value));
  }
}

// r为函子对象，无法取出处理的值
const r = Container.of(5).map(x => x + 1).map(x => x * x);
```

上述代码如果传一个 null 将会报错，所以需要**MayBe**函子来进行处理错误：

```javascript
class MayBe {
  static of(value) {
    return new MayBe(value);
  }
  
  constructor(value) {
    this._value = value;
  }
  
  map(fn) {
    return isNothing ? new MayBe(null) : new MayBe(fn(value));
  }
  
  isNothing() {
    return this._value === null || this._value === undefined;
  }
}
```

MayBe函数可以解决传递空值的问题，但是如果在调用 map 方法传递的函数返回空值时无法得出是哪个环节出了问题。

**Either**函子：进行异常处理

```javascript
class Left {
  static of(value) {
    return new Left(value);
  }
  
  constructor(value) {
    this._value = value;
  }
  
  map(fn) {
    return this;
  }
}

class Right {
  static of(value) {
    return new Right(value);
  }
  
  constructor(value) {
    this._value = value;
  }
  
  map(fn) {
    return Right.of(fn(this._value));
  }
}

const r1 = Right.of(12).map(x => x + 2);
const r2 = Left.of(12).map(x => x + 2);

function parseJSON(str) {
  try {
    return Right.of(JSON.parse(str));
  } catch(e) {
    return Left.of({ error: e.message });
  }
}

const r = parseJSON('{ name: zs }'); // 函子中存储错误信息
```

**IO**函子：内部的 _value 是一个函数，把函数作为值进行处理。该函子可以把不纯的动作存储到 _value中，延迟执行这个不纯的动作(惰性执行)。最后将不纯的操作交给调用者处理。

```javascript
const fp = require('lodash/fp');

class IO {
  static of(value) {
    return new IO(function() {
      return value;
    })
  }
  
  constructor(fn) {
    this._value = fn;
  }
  
  map(fn) {
    return new IO(fp.flowRight(fn, this._value));
  }
}

const r = IO.of(process).map(p => p.execPath);
```

**folktale**中的**task**函子：处理异步任务。

```javascript
const { compose, curry } = require('folktale/core/lambda');

// 第一个参数为函数参数个数
let f = curry(2, (x, y) => {
  return x + y;
})

console.log(f(1, 2)); // 3
console.log(f(1)(2)); // 3
```

```javascript
// task处理异步
const fs = require('fs');
const { task } = require('folktale/concurrency/task');
const { split, find } = require('lodash/fp');

function readFile(filename) {
  return task(resolver => {
    fs.readFile(filename, 'utf-8', (err, data) => {
      if(err) resolver.reject(err);
      
      resolver.resolve(data);
    })
  })
}

readFile('package.json')
	.map(split('\n'))
	.map(find(x => x.includes('version')))
	.run()
	.listen({
  	onRejected: err => {
      console.log(err);
    },
  	onResolved: val => {
      console.log(val);
    }
})
```

**Pointed**函子：实现了 of 静态方法的函子。

IO函子的问题:

```javascript
const fs = require('fs');
const fp = require('lodash/fp');

class IO {
  static of(value) {
    return new IO(function() {
      return value;
    })
  }
  
  constructor(fn) {
    this._value = fn;
  }
  
  map(fn) {
    return new IO(fp.flowRight(fn, this._value));
  }
}

const readFile = function(filename) {
  return new IO(function() {
    return fs.readFileSync(filename, 'utf-8');
  })
}

const print = function(x) {
  return new IO(function() {
    console.log(x);
    return x;
  })
}

// return IO(IO(x))
const cat = fp.flowRight(print, readFile);
const r = cat('package.json')._value()._value();
console.log(r);
```

**Monad**函子是可以变扁的 Pointed 函子，IO(IO(x))，一个函子如果具有 join 和of两个方法并遵守一些定律就是一个Monad。

```javascript
const fs = require('fs');
const fp = require('lodash/fp');

class Monad {
  static of(value) {
    return new IO(function() {
      return value;
    })
  }
  
  constructor(fn) {
    this._value = fn;
  }
  
  map(fn) {
    return new IO(fp.flowRight(fn, this._value));
  }
  
  join() {
    return this._value();
  }
  
  // 同时调用 map 和join
  flatMap(fn) {
    return this.map(fn).join();
  }
}

const readFile = function(filename) {
  return new IO(function() {
    return fs.readFileSync(filename, 'utf-8');
  })
}

const print = function(x) {
  return new IO(function() {
    console.log(x);
    return x;
  })
}

// 返回函子使用flatMap，返回值调用map
const r = readFile('package.json').map(fp.toUpper).flatMap(print).join();
```
