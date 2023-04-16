---
layout: ../../layouts/PostLayout.astro
title: TS内置类型实现
author: Lovell Liu
date: 2022-4-20
---

## TOC

## 一、映射类型

### 1、基本使用

语法：`{ [p in K]: T }`

Partial类型实现：

```typescript
type Partial<T> = { [P in keyof T]?: T[P] | undefined] };
```

Readonly类型实现：

```typescript
type Readonly<T> = { readonly [P in keyof T]: T[P] };
```

`keyof`操作符的作用是将类型 T 的属性名组成联合类型返回，比如类型T 有x，y，z属性，最后返回x ｜ y ｜ z联合类型。

### 2、重映射

在TS4.1版本中可以使用 as 子句对映射类型的键进行重映射(Key Remapping)：

```typescript
type PartialWithRemap<T> = { [P in keyof T as NewKeyType]: T[P] | undefined }
```

NewKeyType必须是**string** | **number** | **symbol**的子类型。

----

使用重映射实现**Omit**内置类型：

```typescript
type Omit<T, K extends keyof T> = { [P in keyof T as Exclude<keyof T, K>]: T[P] }
```

## 二、条件类型

### 1. 基本使用

语法：`T extends U ? X : Y`

Exclude类型实现：

```typescript
type Exclude<T, U> = T extends U ? never : T
```

Extract类型实现：

```typescript
type Extract<T, U> = T extends U ? T : never
```

NonNullable类型实现：

```typescript
type NonNullable<T> = T extends null | undefined ? never : T
```

### 2. infer推断

对于函数类型想要获取其参数或者 return 的返回类型就要用到 infer 关键字

```typescript
type Parameters<T> = T extends (...args: infer P) ⇒ any ? P : never
```

ReturnType类型实现：

```typescript
type ReturnType<T> = T extends (...args: any) ⇒ infer R ? R : any
```

### 3. 分布式条件类型

在条件类型中，如果被检查的类型是一个裸类型参数：没有被数组、元组或 Promise 等包装过，那么该条件类型被称为分布式条件类型。

当分布式条件类型传入的类型是联合类型时，在运算过程中会被分解成多个分支

### 4. 协变位置和逆变位置

- 协变：允许子类型赋值给父类型
- 逆变：允许父类型赋值给子类型
- 协变位置：函数的返回值位置
- 逆变位置：函数的参数位置

现在要实现一个获取对象键的类型PropertyType：

```typescript
type PropertyType<T> = T extends { [key: string]: infer U } ? U : never;

type User = {
  id: number;
  name: string
};

type UserPropertyType = PropertyType<User>; // number | string
```

此时 U 所处的位置即是协变位置，该位置上同一个类型变量存在多个候选者的话，最终的类型将被推断为联合类型。

下面是一个逆变位置的例子：

```typescript
type Bar<T> = T extends { a: (x: infer U) => void, b: (x: infer U) => void } ? U : never;
```

逆变推断为交叉类型。

最后实现一个将联合类型转成交叉类型的类型：

```typescript
type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (arg: infer R) => void ? R : never
```

## 三、类型实现

### 1. Equal

```typescript
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T> extends Y ? 1 : 2 ? true : false;
```

### 2. Pick

```typescript
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
```

### 3. Omit

[使用重映射实现 Omit 内置类型：](craftdocs://open?blockId=A0846306-58D8-4A11-B868-0BD9B0CE5A5B&spaceId=a00fc09b-5dd0-bc21-aaeb-f7e491dce279)

```typescript
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type Omit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };
```

### 4. Readonly

[Readonly类型实现：](craftdocs://open?blockId=F3B41D52-CAF5-4DB4-A431-585F93F7011A&spaceId=a00fc09b-5dd0-bc21-aaeb-f7e491dce279)

### 5. Exclude

[Exclude类型实现：](craftdocs://open?blockId=C42EDB81-1490-442E-AF89-06B868B7F450&spaceId=a00fc09b-5dd0-bc21-aaeb-f7e491dce279)

### 6. Awaited

```typescript
type Awaited<T> = T extends Promise<infer P> ? P extends Promise<any> ? Awaited<P> : P : error;
```

### 7. TupleToObject

```typescript
type TupleToObject<T extends readonly unknown[]> = { [P in T[number]]: P };
```

### 8. First

```typescript
type First<T extends unknown[]> = T extends [] ? never : T[0];
```

### 9. Length of Tuple

```typescript
type LengthOfTuple<T extends readonly unknown[]> = T['length'];
```

### 10. If

```typescript
type If<C extends boolean, T, F> = C extends true ? T : F;
```

### 11. Concat

```typescript
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];
```

### 12. Includes

```typescript
type Includes<T extends readonly any[], U> = T extends [infer H, ... infer R] ? Equal<H, U> extends true ? true: Includes<R, U> : false;
```

### 13. Push

```typescript
type Push<T extends unknown[], U> = [...T, U];
```

### 14. Unshift

```typescript
type Unshift<T extends unknown[], U> = [U, ...T];
```

### 15. Parameters

[type Parameters<T> = T extends (...args: infer P) ⇒ any ? P : never](craftdocs://open?blockId=A2D85EC4-965B-4E48-9404-FF30ECBE4FF0&spaceId=a00fc09b-5dd0-bc21-aaeb-f7e491dce279)

### 16. ReturnType

[ReturnType类型实现：](craftdocs://open?blockId=669589C8-E428-4007-8E01-F31D9007A9F0&spaceId=a00fc09b-5dd0-bc21-aaeb-f7e491dce279)

### 17. Readonly2

```typescript
type MyReadonly2<T, K extends keyof T = keyof T> = { readonly [P in K]: T[P] } & Omit<T, K>;
```

### 18. Deep Readonly

```typescript
type DeepReadonly<T> = {
	[K in keyof T]: keyof T[K] extends never ? T[K] : DeepReadonly<T[K]>
}
```

### 19. Tuple To Union

```typescript
type TupleToUnion<T extends readonly unknown[]> = T[number];
```

### 20. Chain-able

```typescript
type Chainable<T = {}> = {
	option<K extends string, V>(key: K extends keyof T ? never : K, value: V): Chainable<T & { [P in K]: V };
	get(): T;
}
```

### 21. Last of Array

```typescript
type LastOfArray<T extends unknow[], U> = T extends [...unknown, infer R] : R : never;
```

### 22. Pop

```typescript
type Pop<T extends number[], U> = T extends [...infer H, unknown] ? H : never;
```

### 23. PromiseAll

```typescript
declare function PromiseAll<T extends unknown[]>(values: readonly [...T]): Promise<{ [P in keyof T]: T[P] extends Promise<infer R> ? R : T[P]}>;
```

### 24. Lookup

```typescript
type Lookup<T, U> = T extends { type: U } ? T : never;
```
