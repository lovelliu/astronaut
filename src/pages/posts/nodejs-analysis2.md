---
layout: ../../layouts/PostLayout.astro
title: Nodejs剖析之网络模块
author: Lovell Liu
date: 2021-10-7
---

## TOC

## 一、创建 TCP 通信

进行通信依赖于底层的**net**模块。

通信事件：

- listening事件：调用server.listen方法后触发
- connection事件：新的连接建立时触发
- close事件：当 server 关闭时触发
- error事件：当错误出现的时候触发

创建服务端：

```javascript
// server.js
const net = require('net');
// 创建服务端实例
const server = net.createServer();

const PORT = 1234;
const HOST = '127.0.0.1';

server.listen(PORT, HOST);

server.on('listening', () => {
  console.log('服务端已开启')
})

// 接收消息 回写消息
server.on('connection', (socket) => {
  socket.on('data', (chunk) => {
    const msg = chunk.toString();
    console.log(msg); // hello, server
    socket.write(Buffer.from('hello, client'));
  })
})

server.on('close', () => {
  console.log('服务器关闭了');
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('地址正在被使用');
  } else {
    console.log(err);
  }
})
```

创建客户端：

```javascript
// client.js
const net = require('net');

const client = net.createConnection({
  port: 1234,
  host: '127.0.0.1',
})

client.on('connect', () => {
  client.write('hello, server');
})

client.on('data', (chunk) => {
  console.log(chunk.toString()); // hello, client
})

client.on('error', (err) => {
  console.log(err);
})

client.on('close', () => {
  console.log('客户端断开连接');
})
```

## 二、TCP粘包问题

### 1. 数据粘包问题

通信需要数据发送端和数据接收端两部分，而发送端发送数据时并非是**实时的**，而是先将待发送的数据存到**缓存区**，等到缓存区数据累计到一定量后**统一发送**，同样接收端接受数据后也会先放到缓存区中再进行消费。

这种设计可以减少**I/O**操作带来的性能消耗，但会带来数据的**粘包**问题。

在上述的创建 TCP 中如果将客户端发送数据的回调中多写入几条数据：

```javascript
// client.js
client.on('connect', () => {
   client.write('hello, server');
   client.write('hello1, server');
   client.write('hello2, server');
   client.write('hello3, server');
 })

// server.js
server.on('connection', (socket) => {
	socket.on('data', (chunk) => {
		const msg = chunk.toString();
    console.log(msg);
		socket.write(Buffer.from('server: ' + msg));
	});
});
```

最后客户端接收到的数据打印输出为`server: hello, serverhello1, serverhello2, serverhello3, server` ，只有一个**server:** ，后面的数据发生了粘包。

要想解决这个问题，最简单的方法是将发送数据的间隔进行延长：

```javascript
// client.js

// 储存待发送的数据
const dataArr = ['hello, server', 'hello1, server', 'hello2, server', 'hello3, server'];

client.on('connect', () => {
	for (let i = 0; i < dataArr.length; i++) {
    // 使用闭包保留每次 i 的值
		(function (val, index) {
			setTimeout(() => {
				client.write(val);
			}, 1000 * (index + 1));
		})(dataArr[i], i);
	}
});

// server: hello, server
// server: hello1, server
// server: hello2, server
// server: hello3, server
```

该方法虽然简单直接，但会影响传输效率。

### 2. 数据的封包与拆包

![image-20220116100620997.png](https://my-picture-bed-1304169582.cos.ap-nanjing.myqcloud.com/uPic/image-20220116100620997.png)

> > 上图为一条完整的消息结构。

> > 核心思想：先将数据进行打包，之后使用数据的时候再按照规则进行拆包。这里使用长度编码的方式来约定通信双方的数据传输方式。

数据传输过程：

- 进行数据编码，获取二进制数据包
- 按规则拆解数据，获取指定长度的数据

```javascript
// myTransform.js
class MyTransformCode {
  constructor() {
		// header总长度
    this.packageHeaderLen = 4;
    // 序列号
    this.serailNum = 0;
    this.serialLen = 2;
  }
  
  // 编码
  encode(data, serialNum) {
    const body = Buffer.form(data);
    // 先按照指定的长度来申请一片内存空间作为 header 来使用
    const headerBuf = Buffer.alloc(this.packageHeaderLen);
    
    // 写入
    headerBuf.writeInt16BE(serialNum || this.serialNum);
    headerBuf.writeInt16BE(body.length, this.serialLen); // 跳过序列号长度
    
    if (serialNum === undefined) {
      this.serialNum++;
    }
    
    return Buffer.concat([headerBuf, body]);
  }
  
  // 解码
  decode(buffer) {
    const headerBuf = buffer.slice(0, this.packageHeaderLen);
    const bodyBuy = buffer.slice(this.packageHeaderLen);
    
    return {
      serialNum: headerBuf.readInt16BE(),
      bodyLength: headerBuf.readInt16BE(this.serialLen),
      body: bodyBuf.toString(),
    }
  }
  
  // 获取包长度
  getPackageLen(buffer) {
    if (buffer.length < this.packageHeaderLen) {
      return 0;
    } else {
      return this.packageHeaderLen + buffer.readInt16BE(this.serialLen);
    }
  }
}

module.exports = MyTransformCode;
```

测试：

```javascript
// test.js
const MyTransform = require('./myTransform.js');
const ts = new MyTransform();
const str1 = 'hello';
console.log(Buffer.from(str1)) 

console.log(ts.encode(str1, 1)); // 前四位为消息头，后面为消息体也就是Buffer.from(str1);

console.log(ts.decode(ts.encode(str1, 1))); // 返回解码信息
```

接下来解决粘包问题：

```javascript
// server.js
const MyTransform = require('./myTransform.js');
// 未处理完 buffer 进行存储
let overageBuffer = null;
const ts = new MyTransform();

server.on('connection', (socket) => {
  socket.on('data', (chunk) => {
    if (overageBuffer) {
      chunk = Buffer.concat([overageBuffer, chunk]);
    }
    let packageLen = 0;
    while (packageLen = ts.getPackageLen(chunk)) {
      const packageCon = chunk.slice(0, packageLen);
      chunk = chunk.slice(packageLen);
      const ret = ts.decode(packageCon);
      console.log(ret);
      socket.write(ts.encode(ret.body, ret.serialNum));
    }
    overageBuffer = chunk;
  })
})
```

```javascript
// client.js
const MyTransform = require('./myTransform.js');
const ts = new MyTransform();
let overageBuffer = null;

client.write(ts.encode('hello'));
client.write(ts.encode('hello1'));
client.write(ts.encode('hello2'));

client.on('data', (chunk) => {
  if (overageBuffer) {
    chunk = Buffer.concat([overageBuffer, chunk]);
  }
  let packageLen = 0;
  while (packageLen = ts.getPackageLen(chunk)) {
    const packageCon = chunk.slice(0, packageLen);
    chunk = chunk.slice(packageLen);
    const ret = ts.decode(packageCon);
    console.log(ret);
    socket.write(ts.encode(ret.body, ret.serialNum));
  }
  overageBuffer = chunk;
})
```

## 三、HTTP模块

### 1. http协议

http协议位于应用层，是 web 服务常用的协议。

```javascript
// server.js
const net = require('net');
const server = net.createServer();

server.listen(1234, () => {
  console.log('server is running');
})
server.on('connection', (socket) => {
  socket.on('data', (data) => {
    console.log(data.toString()) // 输出了 http 请求的内容
  })
  socket.end('test');
})
```

接下来使用 Node 中的 http 模块来创建服务器：

```javascript
// httpServer.js
const http = require('http');
const server = http.createServer((request, response) => {
  // 针对请求完成业务代码并进行响应 
})
server.listen(1234, () => {
  console.log('server is running')
})
```

### 2. 获取 http 请求信息

- 获取请求路径信息，使用 Node 推荐的**WHATWG URL API**来代替**url.parse()**。
- 获取 http 版本号：req.httpVersion

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // 获取请求路径 req.url为 host 后面的部分
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(url);
  /*
  	URL {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  username: '',
  password: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  searchParams: URLSearchParams {},
  hash: ''
  */
  
  // 获取版本号
  console.log(req.httpVersion); // 1.1
  // 请求头
  console.log(req.headers);
  // 请求方式(get/post...)
  console.log(req.method);
  // 请求体数据获取(POST method)
  const arr = [];
  req.on('data', (data) => {
    arr.push(data);
  })
  req.on('end', () => {
    console.log(Buffer.concat(arr).toString());
  })
})
```

### 3. 设置 http 响应

根据客户端请求来进行相应的响应：

```javascript
const server = http.createServer((req, res) => {
	// 设置相应格式
  res.setHeader('Content-type', 'text/html;charset=utf-8');
  // 设置响应码
  res.statusCode = 200;
  res.end('响应');
})
```

### 4. 客户端代理

由于浏览器出于安全考虑的**同源策略**(发送请求需要协议、域名及端口相同)，浏览器只能发送请求给同源的服务端，否则会出现跨域问题，而客户端代理可以将浏览器发送的请求进行转发，客户端代理也是一个服务器(代理服务器)，而服务器之间由于没有同源策略的限制可以进行正常请求。

```javascript
// createAgentClient.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/',
  method: 'POST',
  headers: {
    'Content-type': 'application/x-www-form-urlencoded',
  }
}

const server = http.createServer((req, res) => {
  const req = http.request(options, (res) => {
  let arr = [];
  res.on('data', (data) => {
    arr.push(data);
  });
  res.on('end', () => {
    let ret = Buffer.concat(arr).toString();
    res.setHeader('Content-type', 'text/html;charset=utf-8');
    res.end(ret);
  })
})
	req.end('agent');
})

server.listen(5000, () => {
  console.log('server is running');
})
```

## 四、WebSocket

http协议有一个缺陷，通信只能由客户端发起然后服务端返回查询，做不到服务端主动向客户端推送信息。比如聊天，由于服务端无法主动请求，所以客户端就无法得知对方什么时候给自己发消息，虽然可以采用客户端**轮询**的方式，但缺点也很明显，轮询请求过快，服务端资源开销会增加，过慢，则不能实时返回消息。

所以才出现了 WebSocket 协议，与 http 协议一样，属于应用层协议。

> #### WebSocket

### 1. 介绍

Websocket是一个持久化的网络通信协议，依赖 http 进行一次握手，服务端可以主动推送。 由来：由于 http 是非持久化的协议，客户端要想知道服务端的处理进度只能通过短轮询或长轮询来实现。

特点：可以在单个 TCP 连接上实现全双工通信，没有了 Request 和Response的概念，连接一旦建立，双方可以实时的进行双向数据传输

应用场景：弹幕，聊天室，视频会议，消息订阅，协同编辑等应用实时监听服务端变化

### 2. 首部

**请求首部：**

- Connection：Upgrade：表示要升级协议
- Upgrade： websocket：升级到 websocket 协议
- Sec-Websocket-Version：13：表示 websocket 版本
- Sec-Websocket-Key：与服务端响应首部的Sec-Websocket-Accept是配套的，提供基本的防护，比如恶意连接或者无意的连接

**响应首部：**

- 101 Switching Protocols 还未正式做出响应
- Connection：Upgrade
- Upgrade： websocket
- Sec-Websocket-Accept：根据请求的 key 值生成，表示服务器同意建立连接
3. ### 心跳重连

心跳机制：客户端每隔一段时间向服务端发送一个特有的心跳消息，每次服务端收到消息后只需要将消息返回，如果双方还保持着连接则客户端会收到消息，没收到则需要进行重连。

实现：

```javascript
const heartCheck = {
    timeout: 60000,// 60s
    timeoutObj: null, // 客户端定时器
    serverTimeoutObj: null, // 服务端定时器
    reset: function(){
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
　　　　 this.start();
    },
    start: function(){
		 const self = this;
		 // 开启客户端计时
        this.timeoutObj = setTimeout(function(){
            ws.send("HeartBeat");
			  // 发送成功后开启服务端计时
            self.serverTimeoutObj = setTimeout(() => {
 				ws.close();
            }, self.timeout);
        }, this.timeout);
    }
}

ws.onopen = function () {
   // 连接成功后开始计时
   heartCheck.start();
};

ws.onmessage = function (event) {
    // 收到服务端发来的消息则重置倒计时
    heartCheck.reset();
};

ws.onclose = function () {
	// 断开后重连
    reconnect();
};

ws.onerror = function () {
    // 出错后重连
    reconnect();
};
```
