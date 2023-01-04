---
layout: ../../layouts/PostLayout.astro
title: 应用层知识
author: Lovell Liu
date: 2021-8-11
---

## 一、Http2.0

### 1. 多路复用

在http2.0中帧代表着最小的数据单位，每个帧会标识出该帧属于哪个流，流是有多个帧组成的数据流，一个TCP连接中存在多个流，也就是可以发送多个请求，对端可以通过帧的标识知道属于哪个请求。

作用：避免http旧版本中的队头阻塞问题，提高传输性能，减少了TCP连接数量。

队头阻塞问题：浏览器限制了一个域名下的请求数量，当页面需要请求很多资源时，队头阻塞会导致达到最大请求数量时，剩余的资源需要等待其他资源请求完成后才能发送请求

### 2. 二进制传输

以二进制传输代替原本的明文传输，原本的报文消息被划分为更小的数据帧

### 3. 服务端推送

浏览器发送一个请求，服务器主动向浏览器推送与这个请求相关的资源，这样浏览器就不用发起后续请求了。服务端推送使得服务器可以预测浏览器需要的资源，主动推送到浏览器，例如浏览器请求一个html文件，服务端解析这个页面依赖的其他资源，主动推送到浏览器的缓存中。

优势：

- 客户端可以缓存推送的资源
- 客户端可以拒绝推送过来的资源
- 推动资源可以有不同页面共享
- 服务端可以按照优先级推送资源

### 4. Header压缩

http2.0中使用了HPACK算法对传输的header进行压缩，减少了header的大小

### 5. 应用层的重置连接

对于旧版本的http想要进行重置连接需要设置TCP segment里面的reset flag来通知对端关闭连接的，这种方式会直接断开连接，下次再发请求就必须重新建立连接。在http2.0中引入了RST_STREAM类型的frame，可以在不断开连接的情况下提前取消某个请求的流，表现更好。

补充：流量控制 + 请求优先级设定

## 二、Http3.0

http2.0解决了很多问题，但由于使用了多路复用，使得同一域名下只需要使用一个TCP连接，所以当这个连接出现了丢包的情况，那么就会http2.0的表现不如http1.0。

当出现丢包时，整个TCP都要开始等待重传，导致后面的数据都被堵塞，对于旧版本的http来说可以开启多个TCP连接，出现这种情况只会影响其中一个连接，剩余的连接依旧可以正常传输数据。

为了解决这种问题，Google推出了一个基于UDP协议的QUIC协议，并将该协议用在http3上。

特点：

- 多路复用
- 纠错机制，比如发送了三个包那么协议会算出这三个包的异或值并单独发出一个校验包，当其中的一个非校验包丢失后，可以通过另外三个包计算出丢失的数据包的内容，缺点是丢失多个包就无法纠错了，只能重传
- 流量控制
- 有序交付
- TLS1.3加密
- ......

## 三、Https

> > https = http + 加密 + 验证身份 + 确保数据完整性

1. #### 握手过程
- 首先浏览器将对称加密方法列表、非对称加密方法列表以及一个随机数(client-random)发送给服务器
- 服务器保存随机数，选择对称加密和非对称加密方法，生成一个新的随机数(server -random)，将其与数字证书返回给浏览器
- 浏览器验证数字证书的合法性，根据上面两个随机数计算出一个新的数字(pre-master)，然后利用利用数字证书中的公钥将其进行加密并发送给服务器
- 服务器使用私钥进行解密拿到pre-master并返回确认消息

到此为止服务器和浏览器都具有client-random、server-random和pre-master，服务器和浏览器接下来会使用这三组随机数生成对称密钥，采用对称加密方式进行传输数据

----

2. #### 为什么https数据传输使用对称加密
- 非对称加密的加解密效率低下，而https传输中端与端的交互量很大
- 由于私钥只存储在服务器里，所以非对称加密为单向加解密，浏览器无法解密

----

3. #### 中间人攻击的过程(为什么需要CA机构颁发证书)
- 浏览器请求被劫持，将请求发送到中间人的服务器，其中包括一个随机数
- 中间人服务器返回自己的证书和一个随机数
- 浏览器通过两个随机数生成一个新的随机数并使用中间人服务器返回的数字证书上的公钥进行加密并发送
- 中间人服务器使用私钥进行解密
- 中间人与服务端进行合法的https连接，与服务器使用对称加密数据传输，拿到数据后使用对称密钥进行解密，再与浏览器使用对称加密进行数据传输

----

4. #### 数字签名

数字签名的主要作用是校验数据的完整性

产生过程：首先服务器使用哈希函数处理原文生成消息摘要，然后使用对称密钥进行加密，此时数字签名就产生了

验证过程：

- 服务器将原文和生成的数字签名发送给浏览器
- 浏览器使用哈希函数处理原文生成消息摘要
- 使用对称密钥解密数字签名得到一份消息摘要
- 验证俩分消息摘要是否相同既可以知道数据是否被篡改

局域网设备发现协议：

- SSDP简单设备发现协议
- mDNS协议
- DNS-SD协议
- Bonjour协议

### 四、Websocket协议

### 1. 介绍

Websocket是一个持久化的网络通信协议，依赖http进行一次握手，服务端可以主动推送。 由来：由于http是非持久化的协议，客户端要想知道服务端的处理进度只能通过短轮询或长轮询来实现。

特点：可以在单个TCP连接上实现全双工通信，没有了Request和Response的概念，连接一旦建立，双方可以实时的进行双向数据传输

应用场景：弹幕，聊天室，视频会议，消息订阅，协同编辑等应用实时监听服务端变化

### 2. 首部

Connection：Upgrade：表示要升级协议

Upgrade： websocket：升级到websocket协议

Sec-Websocket-Version：13：表示websocket版本

Sec-Websocket-Key：与服务端响应首部的Sec-Websocket-Accept是配套的，提供基本的防护，比如恶意连接或者无意的连接

### 3. 心跳重连

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

## 五、Http

1. ### http状态码
- 1xx：信息状态码
- 20x成功，
   - 206：请求已成功，但只返回了部分内容，常出现在请求视频资源中
- 301：目标资源被永久重定向，也就是移到了一个新的URI，任何未来对这个资源的引用都应该使用新的URI；302：临时重定向；304：自从上次请求后资源未更新
- ......

### 2. 请求头

- Host
- Connection
- Cookie
- User-Agent
- Accept-Encoding
- Accept-language