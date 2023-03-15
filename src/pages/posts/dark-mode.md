---
layout: ../../layouts/PostLayout.astro
title: 关于深色模式的实现
author: Lovell Liu
date: 2023-1-8
---

## TOC

## 前言
通常情况下，我们浏览的网站采用都是白底黑字的模式，在白天感觉很正常，但到了晚上，光线变弱，白底会让人感到刺眼，因此为了在夜间或光线昏暗的环境减小对人眼的刺激，一种采用黑底白字的模式应运而生 - **深色模式（Dark Mode）**。

深色模式最早还要追溯到上世纪60～80年代的单色显示器，黑底绿字的展示方式成了当时的常态，这种模式备受程序员的喜爱，所以至今大部分程序员的终端都是黑底。真正使其流行是Apple在ios13上正式发布了深色模式，紧接着Windows10也进行了引入。所以现如今越来越多的网站都适配了深色模式，下面一起来看看如何实现网站的深色模式。

## 自定义颜色变量

深色模式并不是简单的颜色反转（例如iPhone里的反转模式），所以需要考虑内容与背景的对比度，为深色模式重新配色，这就需要用到CSS中的 [自定义变量](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) 。正常模式下定义一些CSS颜色变量，深色模式下改变这些变量相应的值即可。例如我们定义一下页面背景色并在body元素上进行应用：

```css
html {
	--bg-color: gray;
}

body {
	background-color: var(--bg-color);
}
```

在深色模式时一般会在html元素上添加dark类名，此时选择器权重增加，就会应用上当前颜色变量：

```css
html {
	--bg-color: gray;
}

html.dark {
	--bg-color: black; /* 给html元素加上dark类名后页面背景变为黑色 */
}

body {
	background-color: var(--bg-color);
}
```

另外我们也可以通过在html元素设置 [color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) 来让元素自己调整以适应不同的模式，对于文字或单色svg可以很方便的让他们在dark下调整为白色。

```css
html {
	--bg-color: gray;
	--color-scheme: light;
	color-scheme: var(--color-scheme);
}

html.dark {
	--bg-color: black; /* 给html元素加上dark类名后页面背景变为黑色 */
	--color-scheme: dark; /* 给html元素加上dark类名后文字和单色svg变为白色 */
}

body {
	background-color: var(--bg-color);
}
```

## 用户偏好

所以在定义后颜色颜色变量并在指定元素应用上后，就可以通过js来添加和移除html上的dark类来进行深浅色模式的切换。

比如我们有一个button按钮，用户想点击它切换到自己喜欢的模式，就可以这么做：

```javascript
const toggleButton = document.querySelector('#toggle')
toggleButton.addEventListener('click', () => {
	const isDark = document.documentElement.classList.contains('dark')
	if (isDark) 
		document.documentElement.classList.remove('dark')
	
	else 
		document.documentElement.classList.add('dark')
})
```

效果：

![iShot_2023-01-15_22.33.24.gif](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/29F36254-5966-45B5-A435-DFE346C94324/7318B7F7-DD7A-4C73-AC5C-71F27C82418D_2/NL3R0ErlL20uQO7SWE7VSVjlhLj2YkVrOlxdG8AA8Yoz/iShot_2023-01-15_22.33.24.gif)

但用户在离开网站后，下次进来仍是默认的模式，因为我们不知道用户离开前选择了哪种，所以我们需要将用户的选择存储到localStorage中：

```javascript
const toggleButton = document.querySelector('#toggle')

// 初始化
localStorage.getItem('theme') ?? localStorage.setItem('theme', 'light')

toggleButton.addEventListener('click', () => {
	const isDark = document.documentElement.classList.contains('dark')
	if (isDark) {
		document.documentElement.classList.remove('dark')
		localStorage.setItem('theme', 'light')
	}
	else {
		document.documentElement.classList.add('dark')
		localStorage.setItem('theme', 'dark')
	}
})
```

这样我们就可以通过访问localStorage来获取用户设置的主题。

## 系统偏好

上面有两种模式供用户选择 - 用户通过手动设置light或dark来实现深色模式的切换并将一直保持在该模式下，还有一种是用户设置跟随系统（我们就给它称之为 **auto** 模式吧），例如macOS设置日落后切换至深色模式，那我们的网站也要跟着切换，这时候该怎么去动态的改变html的dark类呢？

CSS中有一个媒体查询特性 [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) 用来设置对应对应系统主题下的样式，比如白天将会匹配`@media (prefers-color-scheme: light)`下的样式，但我们现在的方式需要去改变html的类名，也就是需要借助js来进行操作，所以要用到 [Window.matchMedia()](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) 方法去匹配该媒体查询，该方法返回一个 **媒体查询列表对象**（MediaQueryList），其有一个布尔类型的`matches`属性可以用来判断当前系统主题用来切换，比如我们有一个下拉列表，里面是白天，夜晚以及跟随系统三个选项，当用户选择了跟随系统这个选项后，先将localStorage中的theme设置为auto，然后执行以下代码：

```javascript
const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
if (prefersColorScheme === 'dark') 
	document.documentElement.classList.add('dark')
else
	document.documentElement.classList.remove('dark')
```

用户刚进入网站也就是初始化的时候，我们就可以通过判断theme是否为auto然后执行上述代码了。

现在只能在用户每次进入网站的时候匹配系统主题进行切换，当系统主题改变时是没办法切换的，为了实现监听系统主题变化，可以监听媒体查询列表对象的 **change** 事件，该事件的matches属性跟上面的作用一样：

```javascript
const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')

mediaQueryList.addEventListener('change', e => {
	if (e.matches === true)
		document.documentElement.classList.add('dark')
	else
		document.documentElement.classList.remove('dark')
})
```

效果：

![iShot_2023-01-15_22.36.39.gif](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/29F36254-5966-45B5-A435-DFE346C94324/1E42E5F0-07EC-448B-AC22-1CD978EA2F37_2/PmTE91nK8vy53jQxlYrKxsMybOK4c0nDwk9fnTIkAToz/iShot_2023-01-15_22.36.39.gif)

## 模式切换

以上一共提供了三种模式，如果是通过一个下拉列表里面放置三种模式选项的情况下，操作起来比较简单，选择哪一种就执行对应的操作即可，但如果现在只有一个button，两个分别对应白天和黑夜的icon，却要对应三种模式该如何实现呢？

light和dark好说，关键是如何将auto嵌入其中，我们可以分析一下：

- 如果一开始localStorage里存储的theme为auto
   - 先判断系统主题是白天还是黑夜
   - 如果是白天，点击button后本地存储变为dark，此时如果再次点击，将会回到原来的模式，那么可以就此进行判断，本地是dark，系统是light的话说明用户想要回到原来的状态，就给本地设为auto，执行相应的操作。
   - 系统是黑夜，点击后本地变为light，再次点击同上，要返回之前的状态设为auto。
- theme为light
	- 先判断系统主题是白天还是黑夜
	- 系统是白天，点击后本地存dark，再次点击回到auto
	- 系统是黑夜，点击后本地存auto，再次点击回到light
- theme为dark同理

从上面可以总结出只要点击后本地要切换到与系统主题相同的时候就设置auto，不同就设置与系统主题对立的就好了。另外需要注意的是本地从auto切至其他模式时需要移除媒体查询对象的监听事件，直接看代码：

```javascript
function toggleDarkMode() {
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const theme = localStorage.getItem('theme')
  // 当前模式是否是深色模式
  const isDark = theme === 'dark' || (theme === 'auto' && colorScheme === 'dark')

  if (isDark) {
    toggle('light') // 执行相应操作
    if (colorScheme === 'dark') {
      localStorage.setItem('theme', 'light')
      mediaQuery.removeEventListener('change', listener)
    }
    else {
      localStorage.setItem('theme', 'auto')
      mediaQuery.addEventListener('change', listener)
    }
  }
  else {
    toggle('dark') // 执行相应操作
    if (colorScheme === 'light') {
      localStorage.setItem('theme', 'dark')
      mediaQuery.removeEventListener('change', listener)
    }
    else {
      localStorage.setItem('theme', 'auto')
      mediaQuery.addEventListener('change', listener)
    }
  }
}

const listener = (e: MediaQueryListEvent) => {
  toggle(e.matches ? 'dark' : 'light')
}
```

**注意，我们的逻辑有三种，也就是对应的本地theme的三种值，但是从用户视觉的角度上只有两种light和dark，所以用户切换无非就是从两者之间选择，但是我们添加的auto逻辑可以跟随系统改变这两种模式。**

由于获取系统主题和用户设置比较常用，我们可以将其封装成函数：

```typescript
/**
 * @description Get user preference from localStorage
 * @returns {string} 'auto' | 'dark' | 'light'
 */
export function getTheme(): string {
  const theme = localStorage.getItem('theme')!
  return theme
}

/**
 * @description Get system preference
 * @returns {string} 'dark' | 'light'
 */
export function getPrefersColorScheme(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
```

包含初始化的完整代码：

```typescript
import { getPrefersColorScheme, getTheme } from '.'

const toggleButton = document.querySelector<HTMLButtonElement>('#toggle')!
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const listener = (e: MediaQueryListEvent) => {
  toggle(e.matches ? 'dark' : 'light')
}

toggleButton.addEventListener('click', toggleDarkMode)

// Initialize theme
localStorage.getItem('theme') ?? localStorage.setItem('theme', 'auto')
const theme = getTheme()
const colorScheme = getPrefersColorScheme()
theme === 'auto' && mediaQuery.addEventListener('change', listener)
theme === 'auto'
  ? colorScheme === 'dark'
    ? toggle('dark')
    : toggle('light')
  : theme === 'dark'
    ? toggle('dark')
    : toggle('light')

/**
 * @description Toggle theme
 */
export function toggleDarkMode() {
  const colorScheme = getPrefersColorScheme()
  const theme = getTheme()
  const isDark = theme === 'dark' || (theme === 'auto' && colorScheme === 'dark')

  if (isDark) {
    toggle('light')
    if (colorScheme === 'dark') {
      localStorage.setItem('theme', 'light')
      mediaQuery.removeEventListener('change', listener)
    }
    else {
      localStorage.setItem('theme', 'auto')
      mediaQuery.addEventListener('change', listener)
    }
  }
  else {
    toggle('dark')
    if (colorScheme === 'light') {
      localStorage.setItem('theme', 'dark')
      mediaQuery.removeEventListener('change', listener)
    }
    else {
      localStorage.setItem('theme', 'auto')
      mediaQuery.addEventListener('change', listener)
    }
  }
}

/**
 * @description Perform some operations when the theme changes
 * @param mode 'dark' | 'light'
 * @param toggleButton toggle button element
 */
export function toggle(mode: 'dark' | 'light'): void {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
	// other operations，例如操作DOM切换icon
  }
  else {
    document.documentElement.classList.remove('dark')
	// other operations
  }
}
```

效果：

![iShot_2023-01-15_22.38.38.gif](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/29F36254-5966-45B5-A435-DFE346C94324/FF8D2C41-5C54-4293-A219-76B4D26F491A_2/llUSnOAelMJaxM4t0arsjijVMRNGvH8InyW31t5kxCEz/iShot_2023-01-15_22.38.38.gif)

## 闪烁问题

当theme为dark或theme为auto系统为dark时，无论是重新进入页面或者是刷新的时候，页面会发生闪烁：

![iShot_2023-01-15_22.41.04.gif](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/29F36254-5966-45B5-A435-DFE346C94324/43785B66-0186-4D1A-B7E9-4E02247FDA1E_2/TX4w7EN2FP83xBGfzOtte0K1IxmcyzyslGQxz2SqeZYz/iShot_2023-01-15_22.41.04.gif)

这又是为什么呢？

从图中可以看出，问题是发生在初始化的时候，刚开始渲染的时候html元素是没有dark类的，是我们通过js来动态添加的，而js是单线程，为了不阻塞页面渲染一般是将其放置在body元素结束标签的前面，所以导致我们不能及时的给html元素添加dark类从而造成页面发生闪烁问题。

为了解决这个问题，我们只需要把一部分初始化的代码放置到head标签里即可，虽然我们的常识是script不要放置到head里，而且逻辑上也有一定的重复，但考虑到这种情况且代码很简单，并不会产生性能问题。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="author" content="Lovell Liu" />
    <meta name="robots" content="follow, index" />
    <meta name="generator" content={Astro.generator} />
    <title></title>
    <script>
		localStorage.getItem("theme") ?? localStorage.setItem("theme", "auto");
		const theme = localStorage.getItem("theme");
		const colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark": "light";
		const isDark = theme === "dark" || (theme === "auto" && colorScheme === "dark");
		isDark === true && document.documentElement.classList.add("dark");
	</script>
  </head>
  <body>
  </body>
</html>
```

这样无闪烁、功能齐全的深色模式功能就已经完成了。

