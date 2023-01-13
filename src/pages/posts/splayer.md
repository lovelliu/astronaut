---
layout: ../../layouts/PostLayout.astro
title: React实现视频播放器组件
author: Lovell Liu
date: 2022-6-10
---

## TOC

## 前言

现在人们已经离不开从视频中获取乐趣，对于这些网站视频播放器是一个很重要的功能，因此我准备写一个视频播放器组件并将其发布成`npm`包方便使用。

## 背景

最近才学完`React`不久，准备先用它和开发体验很好的`Vite`进行编写，等到该组件完善后再将仓库转为`Monorepo`，并添加上`Vue3`的版本。

## 技术选型

React18 + Vanilla-Extract + Vite

## 组件结构

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/B6C44B95-FF35-4A85-8FD2-AB366F863773/994E0A66-CB2B-4D4A-AF9A-9F9146886CDC_2/3WVaeelijpyru4y0Ip3f1hxv3Rgkjteyf9T3hoNk4Xcz/Image.png)

首先在最外层我们使用 [figure](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure) 标签来包裹，里面放上`video`元素，为了实现**关灯**功能，我们在`video`元素下面放置一个`div`标签，设置宽高分别为100vw和100vh，使其撑满整个页面，并设置固定定位使其**脱离文档流。**

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/B6C44B95-FF35-4A85-8FD2-AB366F863773/876D2F2A-EA34-42AB-9619-145DD3CAD0DD_2/CG6nB7JNnGaTpuk7bgqskL2idnD30Lfsoop4XJ5x3Ekz/Image.png)

由于视频播放会处于加载状态，我们需要加上loading动画，提高用户体验，因此下面放置**加载缓冲**组件，最后是核心组件`Controller`，外面包裹上`Context`，用于向下传递组件的通用数据。

### Controller

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/B6C44B95-FF35-4A85-8FD2-AB366F863773/D60F02D9-CAC9-4D64-B2C8-F8E0D4D25F13_2/qFiedeWX7y2zrxNUM6XT7z6A0PdtZLyq7osHP4RXxMMz/Image.png)

controller组件是整个组件的核心组件，为了能够检测到鼠标的**移入需**撑满整个组件，覆盖在video元素上面。

里面包含一片区域用于检测鼠标是否进行点击来播放/暂停视频。下面放入进度条和视频控件：

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/B6C44B95-FF35-4A85-8FD2-AB366F863773/FFE245CF-1748-4878-9B1B-77A528452382_2/fq5kqNney8KWx5EXhtygbJtrObgZvkEEVuKGOf8ptZoz/Image.png)

### controls

![Image.png](https://res.craft.do/user/full/a00fc09b-5dd0-bc21-aaeb-f7e491dce279/doc/B6C44B95-FF35-4A85-8FD2-AB366F863773/C090B86E-0065-47F6-AE3C-D23928C3040C_2/IxgZSEUjkxtOm2ulWcYEcrW9RoQ98FkrgNFUy1Kqk18z/Image.png)

视频控件包含对视频的一些功能控制：

- 切换画质
- 倍速
- 音量调节
- 设置
   - 循环播放
   - 关灯
- 截图
- 画中画
- 网页全屏
- 全屏

## Core

为了实现组件的自定义配置，我们需要将父组件传入的数据通过`props`出入视频组件内部，例如组件的宽高，视频的src等。

首先通过`useRef`钩子来获取一些DOM元素：

```typescript
// 对应figure标签
const videoContainerRef = useRef<HTMLElement>(null!);

const lightOffMaskRef = useRef<HTMLDivElement>(null);

const videoRef = useRef<HTMLVideoElement>(null!);

// 检测视频源是否可用
const timerToCheckVideoIsUseful = useRef<NodeJS.Timeout | null>(null);
```

在`useEffect`中进行初始化，设置视频组件的宽高，为了支持hls（HTTP Live Streaming）引入`hls.js`这个库，封装一个函数在初始化时调用：

```typescript
const setHls = (videoElem: HTMLVideoElement) => {
    if (videoType && videoType === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElem);
      }
    }
  };
```

视频源由于一些原因可能加载失败，我们需要在`useEffect`初始化时使用定时器进行检测：

```typescript
timerToCheckVideoIsUseful.current = setTimeout(() => {
      // 0: NETWORK_EMPTY    3: NETWORK_NO_SOURCE
      if (videoElem.networkState === 0 || videoElem.networkState === 3) {
        toast({
          message: 'Error: Video source is not found',
          duration: 4000,
          position: toastPosition,
        });
      }
      else {
        clearTimeout(timerToCheckVideoIsUseful.current!);
      }
    }, 3000);
```

接下来给video元素添加两个事件：`waiting`和`playing`，当视频等待加载时设置`Buffer`组件显示，播放时进行隐藏，`useEffect`返回的回调函数中清除定时器和这两个事件，至此`useEffect`中的工作完成。

### useVideo hook

该hook主要用于定义video元素的一些参数并为其添加一些事件监听，这些参数以对象的形式存储在`useRef`返回的对象中，这是`useRef`的另一个用法，主要是解决数据改变触发`React`频繁更新的问题，使用`useRef`后数据会响应式改变，但页面并不会更新，能够提高性能，如果想更新，可以通过`useState`返回的`setState`进行调用来强制更新，`useReducer`也同样可以实现：

```typescript
const useMandatoryUpdate = () => {
  const [, forceUpdate] = useReducer(v => v + 1, 0);
  return forceUpdate;
};
```

最后返回`videoAttributes`和`videoMethods`等：

```typescript
interface VideoAttributes<T = number, K = boolean> {
  /**
   * @description whether to play
   */
  isPlay: K;
  /**
   * @description current time, unit: s
   */
  currentTime: T;
  /**
   * @description total time, unit: s
   */
  duration: T;
  /**
   * @description buffered time, unit: s
   */
  bufferedTime: T;
  /**
   * @description wether to enable picture-in-picture mode
   */
  isPicInPic: K;
  /**
   * @description volume
   */
  volume: T;
  /**
   * @description video playback speed
   */
  multiple: T;
  /**
   * @description whether to end
   */
  isEnded: K;
  /**
   * @description error
   */
  error: null | T;
}

interface VideoMethod<T = NoParamsVoidFn> {
  /**
   * @description reload
   */
  load: T;
  /**
   * @description start playing
   */
  play: T;
  /**
   * @description pause
   */
  pause: T;
  /**
   * @description set volume
   */
  setVolume: ParamsVoidFn<number>;
  /**
   * @description set the playing position of the specified video
   */
  seek: ParamsVoidFn<number>;
  /**
   * @description set source of the video
   */
  setVideoSrc: ParamsVoidFn<string>;
}
```

### useVideoFlow hook

该`hook`包含了`Controls`和`Progress`组件的一些状态信息，由于类别较多，使用`useReducer`来进行派发：

```typescript
interface VideoStateType<K = boolean, T = number> {
  /**
   * @description whether to show the control component
   */
  isControl: K;
  /**
   * @description the changing data of the onProgressMouseDown event
   */
  progressSliderChangeVal: T;
  /**
   * @description the changing data of the onProgressMouseUp event
   */
  progressMouseUpChangeVal: T;
  /**
   * @description video quality
   */
  quality: QualityKey | undefined;
}

function useVideoFlow() {
  const reducer = (state: VideoStateType, action: MergeAction) => {
    switch (action.type) {
      case 'isControl':
        return { ...state, isControl: action.data };
      case 'progressSliderChangeVal':
        return { ...state, progressSliderChangeVal: action.data };
      case 'progressMouseUpChangeVal':
        return { ...state, progressMouseUpChangeVal: action.data };
      case 'quality':
        return { ...state, quality: action.data };
      default:
        return state;
    }
  };
  const [videoFlow, dispatch] = useReducer(reducer, initialState);
  return { videoFlow, dispatch };
```

### useCallback hook

为了执行用户传进来的回调函数，封装一个`hook`来统一执行，例如播放暂停时执行的回调，视频结束时的回调等等：

```typescript
interface VideoCallback<T = CallbackType, U = CallbackType<QualityKey>> {
  /**
   * @description drag the progress bar callback
   */
  onProgressMouseDown: T;
  /**
   * @description video start playing callback
   */
  onPlay: T;
  /**
   * @description video pause callback
   */
  onPause: T;
  /**
   * @description time change callback
   */
  onTimeChange: T;
  /**
   * @description video end callback
   */
  onEndEd: T;
  /**
   * @description slider release callback
   */
  onProgressMouseUp: T;
  /**
   * @description play error callback
   */
  onError: NoParamsVoidFn;
  /**
   * @description volume change callback
   */
  onVolumeChange: T;
  /**
   * @description quality change callback
   */
  onQualityChange: U;
}
```

### 数据传递

为了子组件能够获取到通用的数据，我们给`Controller`组件包裹上一层`Context`，并将需要共享的数据通过`useMemo`缓存起来赋值给其`value`属性：

```typescript
const contextProps = useMemo(() => {
    return Object.assign(
      {},
      {
        videoRef: videoRef.current,
        videoContainerRef: videoContainerRef.current,
        lightOffMaskRef: lightOffMaskRef.current,
        dispatch,
        videoFlow,
        propsAttributes: options,
      },
    );
  }, [videoRef.current, videoFlow, options]);
```

除了向内传递数据，在使用视频组件的时候也需要向外传递组件的一些参数，我们使用`useImperativeHandle`这个hook来向外传递组件内部数据。

```typescript
useImperativeHandle(ref, () => {
    return {
      video: videoRef.current,
      ...videoMethod,
      ...videoAttributes,
    };
  });
```

## Controller

`Controller`组件时铺满整个组件的，当鼠标移入该组件时需要显示控件，所以给它加上两个事件监听：`onMouseEnter`和`onMouseLeave`，通过`ContextProps`传递来的`dispatch`方法来派发`isControl`的值。

为了检测鼠标是否在点击区域和`Controls`内移动，我们分别定义`userActivity`和`isControlsContainerMove`变量来表示，另外需要两个定时器，在`useEffect`中，先使用循环定时器，在其中通过`userActivity`来判断鼠标是否移动，移动的话进行则清除另一个在鼠标未移动时隐藏的定时器：

```typescript
useEffect(() => {
    timer.current = setInterval(() => {
      if (userActivity.current) {
        /**
         * @description reset
         */
        userActivity.current = false;
        dispatch!({ type: 'isControl', data: true });
        controllerRef.current.style.cursor = 'pointer';
        inactivityTimeout.current && clearTimeout(inactivityTimeout.current);
        inactivityTimeout.current = setTimeout(
          () => {
            /**
             * @note the mouse doesn't hide when the mouse is moving in the controller
             */
            if (!userActivity.current && !isControlsContainerMove.current) {
              dispatch!({ type: 'isControl', data: false });
              controllerRef.current.style.cursor = 'none';
            }
          },
          propsAttributes!.hideMouseTime ? propsAttributes!.hideMouseTime : 2000,
        );
      }
    }, 200);

    return () => {
      timer.current && clearInterval(timer.current);
    };
  }, []);
```

然后给点击区域和`Controls`区域分别加上对应的鼠标移动和离开事件以改变上述两个变量的值。

为了控制`Screenshot`组件的显示，需要在`Controller`组件中将`setIsScreenshot`传递给`Controls`，将`isScreenshot`通过`props`传递给`Screenshot`组件。

## Progress

进度条通过`opacity`来控制显示与隐藏，如果`videoFlow`中`isControl`属性为`true`则设为1，`false`为0。

### 缓冲条和播放条

遇到视频进度条时，除了当前进度外还有一条白色的进度条，这就是缓冲条，表示**当前缓冲的进度**，其默认宽度设为0%，然后根据`useVideo`返回的已缓冲时间`bufferedTime`和总时长`duration`相除并乘以100得到百分比：

```typescript
const calculateBufferedPercent = useMemo(() => {
    return ((bufferedTime / duration) * 100).toString();
  }, [bufferedTime, duration]);
```

播放条表示**当前播放的进度**，将`bufferedTime`换成`currentTime`即可：

```typescript
const calculateProcessPercent = useMemo(() => {
    return ((currentTime / duration) * 100).toString();
  }, [duration, currentTime]);
```

### useProgress hook

该`hook`记录了当前进度条的一些信息，比如用户是否在移动进度条，进度条的百分比，位置信息等，与`useVideoFlow`一样通过`useReducer`来进行控制：

```typescript
export const useProgress = () => {
  const initialState = {
    positionX: 0,
    isMovingProgress: false,
    progressPercent: 0,
    isDrag: false,
  };

  const reducer = (state: ProgressVariableType, action: MergeAction) => {
    switch (action.type) {
      case 'positionX':
        return { ...state, positionX: action.data };
      case 'isMovingProgress':
        return { ...state, isMovingProgress: action.data };
      case 'progressPercent':
        return { ...state, progressPercent: action.data };
      case 'isDrag':
        return { ...state, isDrag: action.data };
      default:
        return state;
    }
  };
  const [progressState, dispatch] = useReducer(reducer, initialState);

  return { progressState, dispatch };
};
```

### 拖动条

为了检测鼠标是否放在进度条区域，我们设置一个高度较大的区域覆盖在进度条上，当鼠标放在该区域上则通过`mousemove`来进行监听，派发`isMovingProgress`事件的值为true，并且在`useEffect`中给判断`isMovingProgress`的值来控制进度条的高度和小圆点的显示，当用户离开该区域则设置`isMovingProgress`为false恢复之前的状态。

接下来在`mousemove`事件中通过计算**鼠标的距离左侧视口的距离**和**拖动条距离左侧视口的距离**之差来求得当前鼠标在进度条上的位置，然后通过与拖动条的宽度比来求出**当前视频播放比：**

```typescript
const popCurrentVideoImgBox = (e: MouseEvent) => {
    const seekPositionX
      = e.clientX - progressSeekMaskRef.current.getBoundingClientRect().left + 1;
    dispatch({
      type: 'progressPercent',
      data: seekPositionX / progressSeekMaskRef.current.offsetWidth,
    });
    dispatch({ type: 'isMovingProgress', data: true });
    dispatch({ type: 'positionX', data: seekPositionX });
  };
```

如果直接点击则直接修改video的`currentTime`为上面移动过程中获取的百分比然后乘以总时长即可改变当前进度。

当开始拖动该区域时鼠标处于`press`状态，使用`onmousedown`进行监听，计算出当前进度位置后，调用`updateCurrentTime`这个函数来进行更新进度：

```typescript
const updateCurrentTime = (
    seekPositionX: number,
    progressSeekMaskRefOffsetWidth: number,
  ) => {
    if (seekPositionX >= 0 && seekPositionX <= progressSeekMaskRefOffsetWidth) {
      const progressPercent = seekPositionX / progressSeekMaskRefOffsetWidth;
      dispatch({
        type: 'progressPercent',
        data: progressPercent,
      });
      // 更新视频当前播放的时长，使用进度百分比 * 总时长
      Props.videoRef!.currentTime = percentToSeconds(progressPercent, duration);
      dispatch({ type: 'positionX', data: seekPositionX });
      dispatch({ type: 'isMovingProgress', data: true });
      dispatch({ type: 'isDrag', data: true });
    }
    if (seekPositionX < 0)
      Props.videoRef!.currentTime = 0;

    if (seekPositionX > progressSeekMaskRefOffsetWidth)
      Props.videoRef!.currentTime = duration;
  };
```

由于拖拽到释放鼠标过程中只会执行一次`mousedown`事件，所以我们添加一个循环定时器，按照1ms一次的频率执行更新，当触发鼠标拖拽事件的回调函数时，开启该定时器进行持续更新，当用户释放鼠标执行事件移除操作：

```typescript
const changeCurrentTime = () => {
    const progressSeekMaskRefOffsetWidth = progressSeekMaskRef.current.offsetWidth;
    interval.current && clearInterval(interval.current);
    interval.current = setInterval(() => {
      const seekPositionX
        // 使用useWindowClient获取鼠标的位置
        = clientXDistance.current
        - progressSeekMaskRef.current.getBoundingClientRect().left
        + 1;
      updateCurrentTime(seekPositionX, progressSeekMaskRefOffsetWidth);
      Props.dispatch!({ type: 'progressSliderChangeVal', data: Date.now() });
    }, 1);
  };

  const whenMouseUpDo = () => {
    interval.current && clearInterval(interval.current);
    if (currentTime < duration && progressState.isDrag) {
      Props.videoRef!.play();
      dispatch({ type: 'isDrag', data: false });
    }
    dispatch({ type: 'isMovingProgress', data: false });
  };

 useEffect(() => {
    window.addEventListener('mouseup', whenMouseUpDo);
    return () => {
      window.removeEventListener('mouseup', whenMouseUpDo);
    };
  }, [currentTime, duration, progressState.isDrag]);
```

注意：在更新时我们重新计算了鼠标在进度上的位置，为什么不使用鼠标在区域上移动时获取的位置？主要原因是拖拽回调只会执行一次，此时的内部获取的位置是拖拽时的位置，拖拽过程中位置的更新在循环定时器中无法获取到，另外用户在拖拽期间鼠标有可能脱离的检测移动的区域，所以要封装一个hook来重新检测鼠标的位置。

### useWindowClient hook

由于在拖拽期间我们要更新显示**播放条**的进度，所以需要即时获取鼠标距离左视口的位置，而拖拽的鼠标事件只能获取到刚进行拖拽时的鼠标位置，所以需要封装一个hook来辅助：

```typescript
const useWindowClient = (): useWindowSizeType => {
  const [windowDistance, setWindowDistance] = useState<useWindowSizeType>({
    clientX: 0,
    clientY: 0,
  });

  useEffect(() => {
    function handle(e: MouseEvent) {
      setWindowDistance(() => {
        return {
          clientX: e.clientX,
          clientY: e.clientY,
        };
      });
    }
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return { ...windowDistance };
};
```

## Controls

在进度条组件下面是`Controls`组件，是视频组件的一些功能控件。

我们在`Controls`部分设置了`width：calc(100% - 26px)`导致两边存有一些缝隙，当从播放暂停区域移至该区域并停留时，由于该区域既不属于点击播放暂停区域也不属于包裹进度条和控件的区域，所以会触发隐藏`Controls`和鼠标的bug。

因此我们给`Controls`组件添加伪元素来覆盖整个区域：

```typescript
'::after': {
    content: '',
    width: 'calc(100% + 26px)',
    height: '100%',
    ...positionStyle('absolute', 'auto', 'auto', 0, '50%'),
    zIndex: -1,
    transform: 'translateX(-50%)',
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent)',
  },
```

### useControls

为了记录控件的具体信息，封装一个hook来进行管理：

```typescript
const useControls = () => {
  const initialState = {
    volume: defaultVolume,
    isMuted: false,
    isSlideVolume: false,
    isScreenFull: false,
    multiple: 1.0,
    isWebPageFullScreen: false,
    isMute: false,
  };

  const reducer = (state: controlsVariableType, action: mergeAction) => {
    switch (action.type) {
      case 'volume':
        return { ...state, volume: action.data };
      case 'isMuted':
        return { ...state, isMuted: action.data };
      case 'isSlideVolume':
        return { ...state, isSlideVolume: action.data };
      case 'isScreenFull':
        return { ...state, isScreenFull: action.data };
      case 'multiple':
        return { ...state, multiple: action.data };
      case 'isWebPageFullScreen':
        return { ...state, isWebPageFullScreen: action.data };
      case 'isMute':
        return { ...state, isMute: action.data };
      default:
        return state;
    }
  };
  const [controlsState, dispatch] = useReducer(reducer, initialState);

  return { controlsState, dispatch };
};
```

### Monitor

位于左下角的该组件用于展示已播放时长和总时长，以及一个播放暂停按钮。

在`Controls`组件中使用`useVideo`获取到视频元素的参数信息，将`currentTime`和`duration`转换成分钟和秒的形式后和`isPlay`传递给该组件即可，组件内更新播放暂停Icon时通过判断`isPlay`来进行切换。

### Quality

该组件只有传入画质列表且列表长度不为0才会进行展示，为了控制画质列表的展示，我们通过使用`useState`返回的`setIsShow`来进行设置，当点击该组件时设置取反，鼠标离开后设置false。

通过`map`来遍历渲染画质列表，给每一项添加点击事件。

为了能够在`Controls`中获取到用户选择的画质选项，需要给`Quality`组件传入一个回调函数，在用户点击后触发，调用`videoMethod`中的设置视频源并重新定位到当前进度：

```typescript
const qualityToggle: QualityToggleType = (url, key) => {
    contentDispatch!({ type: 'quality', data: key });
    videoMethod.setVideoSrc(url);
    videoMethod.seek(currentTime);
    videoMethod.play();
  };
```

### Multiple

倍速组件使用`map`渲染默认列表并添加点击事件，在其中执行父组件传递过来的回调函数将当前点击的选项数据传递并调用，然后设置video元素的`playbackRate`属性。

### Set

在`Controls`中定义一个`switchChange`函数，当`Set`组件中两个开关改变时触发该函数：

```typescript
const switchChange = (e: string, flag: string) => {
    const { videoRef, lightOffMaskRef } = propsData.current!;
    if (flag === 'lights') {
      if (lightOffMaskRef)
        lightOffMaskRef.style.display = e === 'yes' ? 'block' : 'none';
    }
    else {
      const loop = videoRef!.loop;
      videoRef!.loop = !loop;
    }
  };
```

然后在`Set`组件引用`Switch`组件时传递进去：

```typescript
<Switch
	sole="lights"
	label={i18n(language || defaultLanguage, 'closeLights')}
	onChange={(e: string) => switchChange(e, 'lights')}
	theme={theme}
/>
```

在`Switch`组件中继续调用`Set`传递进来的回调：

```typescript
// switch/index.tsx
const switchChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    e.stopPropagation();
    const status = e.target.value === 'yes' ? 'no' : 'yes';
    setOn(status);
    onChange && onChange(status);
  };
```

### Screenshot

为了能够捕获到视频画面，封装一个`capture`方法：

```typescript
export const capture = (video: HTMLVideoElement, scaleFactor = 0.25) => {
  const w = video.videoWidth * scaleFactor;
  const h = video.videoHeight * scaleFactor;
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx!.drawImage(video, 0, 0, w, h);
  return canvas;
};
```

当点击截图的icon时，调用`Controller`传递进来的`setIsScreenshot`显示截图界面，由于`setState`方法异步执行，Dom并没有更新，所以我们拿不到相应的Dom元素，所以应该在setTimeout中调用`caputre`方法：

```typescript
// controls.tsx
const screenshot = () => {
    setIsScreenshot(true);
    setTimeout(() => {
      const output = document.querySelector('#screenshotCanvas')!;
      const canvas = capture(videoProps.videoRef!, 0.45);
      if (output) {
        setScreenshotLoading(false);
        output.innerHTML = '';
        output.appendChild(canvas);
      }
      else {
        setScreenshotLoading(true);
      }
    });
  };
```
