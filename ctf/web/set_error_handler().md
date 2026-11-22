---
title: set_error_handler()
date: 2026-11-20
---

# set_error_handler()

创建时间：2026-11-21

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
| `ctf=123` | 字符串 `123 |
| `ctf[]=123` | 数组 `['123']` |

- **GET**：写在 URL 里，如 `?ctf[]=flag`
- **POST**：写在请求体里，如 `ctf[]=flag`




## 例题 [Dest0g3 520迎新赛]EasyPHP

![2026-11-21](https://cdn.jsdelivr.net/gh/Min-2233/min-2233-imag@main/2026_11_21.png)

观察源码就知道正常情况下过不了if的，所以只能利用 `set_error_handler()`中的方法，打印出flag。

- **解题思路**：在传参时传入`ctf[]=1` 由于数组和flag连通会报错，触发`set_error_handler()`，那么就顺利打印出flag了。



