---
layout: ../../layouts/PostLayout.astro
title: 实现一个打包时将CSS注入到JS的Vite插件
author: Lovell Liu
date: 2022-7-15
---

## 前言

`Vite` 在2.0版本提供了**Library Mode**（库模式），让开发者可以使用`Vite`来构建自己的库以发布使用。正好我准备封装一个React组件并将其发布为npm包以供日后方便使用，同时之前也体验到了使用`Vite`带来的快速体验，于是便使用`Vite`进行开发。

## 背景

在开发完成后进行打包，出现了如图三个文件：

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/B20C318B-E0B6-422B-910B-A0364A33A7DA_2/ixgTWXeUX1tAyIezUqxyu59LB9yYDe8NxH0ebDV90A8z/Image.png)

其中的`style.css`文件里面包含了该组件的所有样式，如果该文件单独出现的话，意味着在使用时需要进行单独引入该样式文件，就像使用组件库时需在主文件引入其样式一样。

```typescript
import xxxComponent from 'xxx-component';
import 'xxx-component/dist/xxx.css'; // 引入样式
```

但我封装的只是单一组件，样式不多且只应用于该组件上，没有那么复杂的样式系统。

所以打包时比较好的做法是配置构建工具将样式注入到**JS文件**中，从而无需再多一行引入语句。我们知道`Webpack`打包是可以进行配置来通过一个**自执行函数**在DOM上创建`style`标签并将CSS注入其中，最后只输出**JS文件**，但在`Vite`的官方文档中似乎并没有告诉我们怎么去配置。

让我们先来看一下官方提供的配置：

```typescript
// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'MyLib',
      // the proper extensions will be added
      fileName: 'my-lib'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

首先要开启`build.lib`选项，配置入口文件和文件名等基本配置，由于`Vite`生产模式下打包采用的是`rollup`，所以需要开启相关选项，当我们的库是由`Vue`或`React`编写的时候，使用的时候一般也是在该环境下，例如我的这个组件是基于`React`进行编写，那么使用时无疑也是在`React`中进行引入，这样就会造成产物冗余，所以需要在`external`配置中添加上外部化的依赖，以在打包时给剔除掉。`output`选项是输出产物为**umd**格式时（具体格式查看`build.lib.formats`选项，umd为[**Universal Module Definition**](https://github.com/umdjs/umd)，可以直接`script`标签引入使用，所以需要提供一个全局变量）。

[Vite](https://vitejs.dev/config/build-options.html#build-lib)

配置完上述提及到的后，我接着寻找与打包样式相关的内容，然而并没有发现。。。

![7625CB0E-F4E2-4AC2-BFFC-DC8C00CD604C.jpeg](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/C5336C87-5C38-485B-9F8F-331795179CB6_2/2yTh76hnkPd2N5KZN5DV6nbEnzO1Gtyyxv8YSWqFDF8z/7625CB0E-F4E2-4AC2-BFFC-DC8C00CD604C.jpeg)

没关系，我们还可以去仓库[`issues`](https://github.com/vitejs/vite/issues/1579)看看，说不定有人也发现了这个问题。搜索后果不其然，底下竟有高达47条评论：

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/8ACB2607-B0C3-4ACE-A7E3-C8F4E3D2F0D7_2/5lTfTDdm5Up73RrFPpdMukYJwKdrzy9U2Je8H5dMiAYz/Image.png)

点进去后，提问者问到如何才能不生成CSS文件，尤回答说：进行样式注入的DOM环境会产生服务端渲染的不兼容问题，如果CSS代码不多，使用**行内样式**进行解决。

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/E6E3EE1E-9447-417B-85F4-1B27519220C9_2/Yt1osBdx2OPtvHWUOqpnlex9AbRAHe6qpTPAl72Rlkcz/Image.png)

这个回答显然不能让很多人满意（这可能是该issue关闭后又重新打开的原因），因为带样式的库在编写过程中几乎不会采用行内的写法，提问者也回复说道那样自己就不能使用模块化的`Less`了，依旧希望能够给出更多的库模式`options`，然后下面都各抒己见，但都没有一种很好的解决方案被提出。

因此，为了解决我自己的问题，我决定写一个插件。

## Vite Plugin API

`Vite`插件提供的API实际上是一些`hook`，其划分为`Vite`独有hook和通用hook（`Rollup`的hook，由`Vite`插件容器进行调用）。这些hook执行的顺序为：

- Alias
- 带有 `enforce: 'pre'` 的用户插件
- Vite 核心插件
- 没有 enforce 值的用户插件
- Vite 构建用的插件
- 带有 `enforce: 'post'` 的用户插件
- Vite 后置构建插件（最小化，manifest，报告）

`Vite`核心插件基本上是独有hook，主要用于配置解析，构建插件基本上都是`Rollup`的hook，这才是真正起构建作用的hook，而我们现在想要将获取构建好的CSS和JS产物并将其合二为一，所以编写的插件执行顺序应该在构建的插件执行之后，也就是‘**带有 `enforce: 'post'` 的用户插件’（输出阶段）**这一阶段执行。

打开`Rollup`官网，里面的[输出钩子部分](https://rollupjs.org/guide/en/#output-generation-hooks)有这么一张图：

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/3385F784-8A72-462C-B335-AE3E6CC342C8_2/yfqArotrrZdxAUyEjpborm4MWxPD0u4y7MIEXawhqjwz/Image.png)

根据上图可以看到输出阶段钩子的执行顺序及其特性，而我们只需要在写入之前拿到输出的产物进行拼接，因此就得用到上面的`generateBundle`这个hook。

## 实现

官方推荐编写的插件是一个返回**实际插件对象**的工厂函数，这样做的话可以允许用户传入配置选项作为参数来自定义插件行为。

基本结构如下：

```typescript
import type { Plugin } from 'vite';

function VitePluginStyleInject(): Plugin {

  return {
    name: 'vite-plugin-style-inject',
    apply: 'build', // 应用模式
    enforce: 'post', // 作用阶段
    generateBundle(_, bundle) {
    
    }
  };
}
```

`Vite`默认的`formats`有**es**和**umd**两种格式，假设不修改该配置将会有两个`Bundle`产生，`generateBundle`钩子也就会执行两次，其方法的签名及其参数类型为：

```typescript
type generateBundle = (options: OutputOptions, bundle: { [fileName: string]: AssetInfo | ChunkInfo }, isWrite: boolean) => void;

type AssetInfo = {
  fileName: string;
  name?: string;
  source: string | Uint8Array;
  type: 'asset';
};

type ChunkInfo = {
  code: string;
  dynamicImports: string[];
  exports: string[];
  facadeModuleId: string | null;
  fileName: string;
  implicitlyLoadedBefore: string[];
  imports: string[];
  importedBindings: { [imported: string]: string[] };
  isDynamicEntry: boolean;
  isEntry: boolean;
  isImplicitEntry: boolean;
  map: SourceMap | null;
  modules: {
    [id: string]: {
      renderedExports: string[];
      removedExports: string[];
      renderedLength: number;
      originalLength: number;
      code: string | null;
    };
  };
  name: string;
  referencedFiles: string[];
  type: 'chunk';
};
```

我们只用到其中的`bundle`参数，它是一个键由**文件名字符串**值为`AssetInfo`或`ChunkInfo`组成的对象，其中一段的内容如下：

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/3E56D18C-59C9-4518-B51C-B8253DFDC3E1_2/mYBy8BZCFypdf2Zdkr08UNbhmkwyX9XYbTIXTRLT01kz/Image.png)

上图看出CSS文件的值属于`AssetInfo`，我们先遍历`bundle`找到该CSS部分把`source`值提取出来：

```typescript
import type { Plugin } from 'vite';

function VitePluginStyleInject(): Plugin {
  let styleCode = '';

  return {
    name: 'vite-plugin-style-inject',
    apply: 'build', // 应用模式
    enforce: 'post', // 作用阶段
    generateBundle(_, bundle) {
      // + 遍历bundle
      for (const key in bundle) {
        if (bundle[key]) {
          const chunk = bundle[key]; // 拿到文件名对应的值
          // 判断+提取+移除
          if (chunk.type === 'asset' && chunk.fileName.includes('.css')) {
            styleCode += chunk.source;
            delete bundle[key];
          }
        }
      }
    }
  };
}
```

现在`styleCode`存储的就是构建后的所有CSS代码，因此我们需要一个能够实现创建style标签并将`styleCode`添加其中的自执行函数，然后把它插入到其中一个符合条件的`ChunkInfo.code`当中即可：

```typescript
import type { Plugin } from 'vite';

function VitePluginStyleInject(): Plugin {
  let styleCode = '';

  return {
    name: 'vite-plugin-style-inject',
    apply: 'build', // 应用模式
    enforce: 'post', // 作用阶段
    generateBundle(_, bundle) {
      // 遍历bundle
      for (const key in bundle) {
        if (bundle[key]) {
          const chunk = bundle[key]; // 拿到文件名对应的值
          // 判断+提取+移除
          if (chunk.type === 'asset' && chunk.fileName.includes('.css')) {
            styleCode += chunk.source;
            delete bundle[key];
          }
        }
      }

      // + 重新遍历bundle，一次遍历无法同时实现提取注入，例如'style.css'是bundle的最后一个键
      for (const key in bundle) {
        if (bundle[key]) {
          const chunk = bundle[key];
          // 判断是否是JS文件名的chunk
          if (chunk.type === 'chunk' &&
            chunk.fileName.match(/.[cm]?js$/) !== null &&
            !chunk.fileName.includes('polyfill')
          ) {
            const initialCode = chunk.code; // 保存原有代码
            // 重新赋值
            chunk.code = '(function(){ try {var elementStyle = document.createElement(\'style\'); elementStyle.appendChild(document.createTextNode(';
            chunk.code += JSON.stringify(styleCode.trim());
            chunk.code += ')); ';
            chunk.code += 'document.head.appendChild(elementStyle);} catch(e) {console.error(\'vite-plugin-css-injected-by-js\', e);} })();';
            // 拼接原有代码
            chunk.code += initialCode;
            break; // 一个bundle插入一次即可
          }
        }
      }
    }
  };
}
```

最后，我们给这个`style`标签加上**id属性**以方便用户获取操作：

```typescript
import type { Plugin } from 'vite';

// - function VitePluginStyleInject(): Plugin {
function VitePluginStyleInject(styleId: ''): Plugin {
  let styleCode = '';

  return {
    name: 'vite-plugin-style-inject',
    apply: 'build', // 应用模式
    enforce: 'post', // 作用阶段
    generateBundle(_, bundle) {
      // 遍历bundle
      for (const key in bundle) {
        if (bundle[key]) {
          const chunk = bundle[key]; // 拿到文件名对应的值
          // 判断+提取+移除
          if (chunk.type === 'asset' && chunk.fileName.includes('.css')) {
            styleCode += chunk.source;
            delete bundle[key];
          }
        }
      }

      // 重新遍历bundle，一次遍历无法同时实现提取注入，例如'style.css'是bundle的最后一个键
      for (const key in bundle) {
        if (bundle[key]) {
          const chunk = bundle[key];
          // 判断是否是JS文件名的chunk
          if (chunk.type === 'chunk' &&
            chunk.fileName.match(/.[cm]?js$/) !== null &&
            !chunk.fileName.includes('polyfill')
          ) {
            const initialCode = chunk.code; // 保存原有代码
            // 重新赋值
            chunk.code = '(function(){ try {var elementStyle = document.createElement(\'style\'); elementStyle.appendChild(document.createTextNode(';
            chunk.code += JSON.stringify(styleCode.trim());
            chunk.code += ')); ';
            // + 判断是否添加id
            if (styleId.length > 0)
              chunk.code += ` elementStyle.id = "${styleId}"; `;
            chunk.code += 'document.head.appendChild(elementStyle);} catch(e) {console.error(\'vite-plugin-css-injected-by-js\', e);} })();';
            // 拼接原有代码
            chunk.code += initialCode;
            break; // 一个bundle插入一次即可
          }
        }
      }
    }
  };
}
```

至此，这个插件就写好了，是不是很简单。

## 使用

在项目中使用该插件：

```typescript
// vite.config.js
import { defineConfig } from 'vite';
import VitePluginStyleInject from 'vite-plugin-style-inject';

export default defineConfig({
  plugins: [VitePluginStyleInject()],
})
```

执行构建命令后，只输出两个文件：

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/A4A5DF23-33E5-4FE5-B5D3-6CE6AE6C394B_2/5TC4LreHuPB2K6zoPW73byNgzDMR61bcyUrUetANJYIz/Image.png)

引入打包后的文件发现其能正常运行，终于搞定啦～

## 尾言

完成后回到该issue下厚着脸皮放上[项目地址](https://github.com/lhj-web/vite-plugin-style-inject) 😁

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/A0CDE640-6014-45DA-9344-0BEB70545D6B/BE6E97BE-D62C-4F91-B75C-8A4861DDE384_2/LEDEObOy4RPhTo3KH7hWedZnSIG8srwLZg1xlBKBQTcz/Image.png)
