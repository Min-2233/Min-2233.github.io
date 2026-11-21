---
title: PHP 相关漏洞
date: 2026-11-20
---

# PHP 笔记：连接符、数组传参、set_error_handler()

创建时间：2026-11-21

## . 连接符

```php


<?php
$a = 1;
$b = 2;
$a .= $b;
echo $a;   // 12（此时 $a 已是字符串 "12"）
?>


```

## 如何在 POST/GET 中传数组


设键为 `ctf`，值为 `flag`：


| 传参写法 | `$_GET['ctf']` 的值 |
| --- | --- |
| `ctf=flag` | 字符串 `'flag'` |
| `ctf[]=flag` | 数组 `['flag']` |

- **GET**：写在 URL 里，如 `?ctf[]=flag`
- **POST**：写在请求体里，如 `ctf[]=flag`

## 函数：set_error_handler()

作用：注册一个自定义错误处理函数，在发生非致命错误时接管处理，不再走 PHP 默认的错误输出。回调返回 `true` 表示“我已处理”，返回 `false` 则交回 PHP。

例如：

```php
<?php
set_error_handler(function () { echo 'ok'; });   // 必须先注册
$a = $_GET['ctf'];
$b = $a . 'aaa';                                 // 这里出错时才会进 handler
?>
```

如果传入的参数是数组，那么 `$a . 'aaa'` 就会报错，因为数组不能隐式转换成字符串（`Array to string conversion`）。

除了 `E_ERROR`（致命错误）、`E_PARSE`（语法错误）、`E_CORE_ERROR`、`E_CORE_WARNING`、`E_COMPILE_ERROR`、`E_COMPILE_WARNING` 这 6 种，其他报错都会触发 `set_error_handler()` 里的 `echo 'ok'`。



## 例题 [Dest0g3 520迎新赛]EasyPHP

![2026-11-21](https://cdn.jsdelivr.net/gh/Min-2233/min-2233-imag@main/2026_11_21.png)

观察源码就知道正常情况下过不了if的，所以只能利用 `set_error_handler()`中的方法，打印出flag。

- **解题思路**：在传参时传入`ctf[]=1` 由于数组和flag连通会报错，触发`set_error_handler()`那么就顺利打印出flag了。


# php反序列化字符串逃逸

创建时间：2026-11-20

关键函数： `preg_replace()`

功能：字符串替换

```php

$s = 'abc123!@#';
$s = preg_replace('/!@#/', 'defg', $s);   // 3 字节 → 4 字节
echo $s; // abc123defg

```

```php


class U { 
public $name = ''; 
public $admin = false; 
}


```

```php


$u = new U();
$u->name = 'xxxxxxxxxxxxxxxxxxx";s:5:"admin";b:1;}'; //19个x 因为注入片段 ";"s:5:"admin";b:1;} 共 19 字节,每个 x 替换后净增 1 字节。

$s = serialize($u);  //序列化字符串：O:1:"U":2:{s:4:"name";s:38:"xxxxxxxxxxxxxxxxxxx";s:5:"admin";b:1;}";s:5:"admin";b:0;}
$s = preg_replace('/x/', 'xx', $s);   // 19 个 x → 38 个 O:1:"U":2:{s:4:"name";s:38:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";s:5:"admin";b:1;}";s:5:"admin";b:0;}

$u2 = unserialize($s);
var_dump($u2->admin);                 // bool(true) ← 注入成功


```

```text

O:1:"U":2:{s:4:"name";s:38:"xxxxxxxxxxxxxxxxxxx";s:5:"admin";b:1;}";s:5:"admin";b:0;}
O:1:"U":2:{s:4:"name";s:38:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";s:5:"admin";b:1;}";s:5:"admin";b:0;}

```

经过`preg_replace()`后，name的长度变长了，但声明的大小没变，所以后面的`";s:5:"admin";b:1;}`会溢出，溢出部分被 unserialize 当作“新的属性”来解析，`O:1:"U":2:{s:4:"name";s:38:"xxx...xx";s:5:"admin";b:1;}`

所以就利用了反序列化漏洞将admin的值改成了true
