---
title: PHP弱类型
date: 2026-11-22
---

# php弱比较

## == 与 ===（PHP 7）

=== （严格比较）先判断两种字符串的类型是否完全一样再比较（不存在绕过）
== （宽松比较）先将两个字符串转化为相同的类型再比较（存在绕过）

```php
var_dump("admin"==0);   // true
var_dump("1admin"==0);  // false
var_dump("admin1"==0);  // true

var_dump("0e123"=="0e456");  // true
// 0e*** 是科学计数法，表示 0 的多少次方。字符串 "0e123" 先转化为数值 0e123 = 0，
// 再与同样转化后的 "0e456" 比较，0 == 0，所以返回 true
// "admin"==0 成立是因为 "admin" 不以合法数字开头，转数值取 0；
// "1admin" 取到开头的 1，1 == 0 不成立 —— 字符串转数值只看开头连续的数字部分。
```

# 相等矩阵（PHP 7 / PHP 8）

== 按两边的类型组合走分支，命中哪条用哪条：

1. 有一边是 bool 或 null → 两边都转 bool 再比
   ```php
   true == 'admin' → true     null == '' → true     false == 'admin' → false
   // 字符串只有 "" 和 "0" 转 false；"0.0"、"00"、" " 都转 true
   ```

2. 两边都是数字 → 按数值比
   ```php
   1 == 1.0 → true
   ```

3. 一边数字、一边字符串 → PHP 7：字符串转数字；PHP 8：字符串不是数字字符串就把数字转成字符串按字节比
   ```php
   PHP 7：'admin' == 0 → true（admin 转成 0）
   PHP 8：'admin' == 0 → false（0 转成 "0"，再按字节比）
   ```

4. 两边都是字符串 → 两个都是数字字符串则按数值比，否则按字节比
   ```php
   "0e123" == "0e456" → true        "1e3" == "1000" → true
   "abc" == "0" → false             "abc" == "ABC" → false
   ```

5. 数组 vs 数组 → 元素个数相同 + 键相同 + 每个值 ==
   ```php
   [0=>"admin"] == ["admin"] → true        [1,2] == [2=>1,3=>2] → false
   ```

6. 数组 vs 非数组 → 数组恒"更大"，== 为 false
   ```php
   [] == 0 → false        [] == "" → false
   // 例外：有 null/false 参与时按第 1 条走，[] == null → true
   ```

7. 对象 vs 对象 / 其他 → 同类且属性相同才相等；对象与非对象比较恒 false
   ```php
   json_decode('{"a":1}') == "abc" → false
   ```

# MD5绕过（PHP 7 / PHP 8）

**函数**：md5()，ctype_alpha()，var_dump()，is_numeric()

**作用**：

- md5()：php 的内置函数，用来计算字符串的 MD5 摘要（输出是十六进制字符）
- ctype_alpha()：判断字符串是否全是字母；数字、符号、空字符串都返回 false
- var_dump()：输出类型和结果，如 int(123)、bool(true)、NULL、float(1.23)
- is_numeric()：判断是否是数字或数字字符串，如 1.2、.5、1e3、-123、+123；允许前导空白/换行，1e3 这类科学计数法算数字；带 e/E 以外的字母、或 0x 前缀返回 false

**例题1**：

```php
<?php
if (!isset($_GET['user'], $_GET['pass'])) {
    exit;
}

$u = $_GET['user'];
$p = $_GET['pass'];

$ok = ctype_alpha($u) && is_numeric($p) && md5($u) == md5($p);

if ($ok) {
    echo 'flag';
} else {
    echo 'nonono';
}
?>
```

**解法**：

因为 md5('240610708') 的值为：
0e462097431906509019562988736854

md5('QNKCDZO') 的值为：
0e830400451993494058024219903391

在弱比较中他们都是 0，md5('240610708') == md5('QNKCDZO') 返回 true
所以 user 传 QNKCDZO，pass 传 240610708 获得 flag

0e 开头的 md5 摘要：

| 字符串 | 摘要 |
| --- | --- |
| 240610708 | 0e462097431906509019562988736854 |
| QNKCDZO | 0e830400451993494058024219903391 |
| aabC9RqS | 0e041022518165728065344349536299 |
| aabg7XSs | 0e087386482136013740957780965295 |
| QLTHNDT | 0e405967825401955372549139051580 |
| s878926199a | 0e545993274517709034328855841020 |
| s155964671a | 0e342768416822451524974117254469 |
| s214587387a | 0e848240448830537924465865611904 |
| s1091221200a | 0e940624217856561557816327384675 |
| s1885207154a | 0e509367213418206700842008763514 |
| s1836677006a | 0e481036490867661113260034900752 |
| s1184209335a | 0e072485820392773389523109082030 |
| s1502113478a | 0e861580163291561247404381396064 |

## MD5 碰撞（PHP 7 / PHP 8）

**原理**：

MD5 算法本身已经被攻破，可以构造出两段内容完全不同、但摘要完全相同的二进制数据。
这时 md5($a) === md5($b) 成立 —— 严格比较拦不住，因为两个字符串的摘要确实一模一样。

举例：一对摘要都是 79054025255fb1a26e4bc422aef54eb4 的不同字符串：

```text
A = d131dd02c5e6eec4693d9a0698aff95c2fcab58712467eab4004583eb8fb7f89
    55ad340609f4b30283e488832571415a085125e8f7cdc99fd91dbdf280373c5b
    d8823e3156348f5bae6dacd436c919c6dd53e2b487da03fd02396306d248cda0
    e99f33420f577ee8ce54b67080a80d1ec69821bcb6a8839396f9652b6ff72a70

B = d131dd02c5e6eec4693d9a0698aff95c2fcab50712467eab4004583eb8fb7f89
    55ad340609f4b30283e4888325f1415a085125e8f7cdc99fd91dbd7280373c5b
    d8823e3156348f5bae6dacd436c919c6dd53e23487da03fd02396306d248cda0
    e99f33420f577ee8ce54b67080280d1ec69821bcb6a8839396f965ab6ff72a70
```

# 数组绕过：md5() 的严格比较（PHP 7）

**函数**：die()

**作用**：

die()：输出字符串后退出脚本

```php
die;                 // 直接退出
die();               // 同上
die("错误信息");      // 输出字符串后退出
die(1);              // 设置退出码为 1，不输出
```

**例题**：

```php
<?php

$flag = "1234";

if (isset($_GET['name']) and isset($_GET['password']))
{
    if ($_GET['name'] == $_GET['password']) {
        echo 'error';
    }
    else if (md5($_GET['name']) === md5($_GET['password']))
      die('Flag: '.$flag);
    else
        echo 'Invalid password';
}
else
    echo 'Login first!';
?>
```

**解法**：

构造 get 请求，传两个不一样的数组：`?name[]=1&password[]=2`
name 和 password 都是数组，第一步 [1] == [2] 不成立，不会进入 error；
第二步比的是 md5() 的返回值，md5() 收到数组会出错并返回 NULL，NULL === NULL 成立，
输出 flag。因为这里是严格比较，0e 魔术哈希（QNKCDZO…）在这没用。

## SHA1绕过（PHP 7）

**函数**：sha1()

**作用**：

计算字符串的 SHA-1 摘要，输出 40 位十六进制字符（MD5 是 32 位）
原理和 md5() 一样，只是换了摘要算法，所以两种绕过方式也一模一样：

1. 0e 魔术哈希：摘要以 0e 开头、后面全是数字时，会被当成 0
2. 数组绕过：sha1(数组) 出错返回 NULL，两边都传数组时 NULL === NULL 成立

0e 开头的 SHA1 摘要：

| 字符串 | 摘要 |
| --- | --- |
| 10932435112 | 0e07766915004133176347055865026311692244 |
| aaroZmOk | 0e66507019969427134894567494305185566735 |
| aaK1STfY | 0e76658526655756207688271159624026011393 |
| aaO8zKZF | 0e89257456677279068558073954252716165668 |
| aa3OFF9m | 0e36977786278517984959260394024281014729 |
| 0e1290633704 | 0e19985187802402577070739524195726831799 |

# json绕过（PHP 7）

**函数**：json_decode()，json_encode()

**作用**：

- json_decode()：将 json 字符串解码成 php 的数据结构（数组、对象、标量）
  标量：单一的值，如 42、tom、true、3.14
- json_encode()：将 php 的数据结构编码成 json 字符串

**例题**：

```php
<?php
if (!isset($_POST['data'])) {
    echo 'nonono';
    exit;
}

$obj    = json_decode($_POST['data']);
$secret = '*********';

if ($obj == $secret) {
    echo 'flag';
} else {
    echo 'nonono';
}
?>
```

**解法**：

构造 POST 请求，body 直接传 JSON 标量 0（不是一个对象）：
`data=0`
json_decode('0') 返回 int(0)，弱比较中 0 == $secret 成立，输出 flag。

payload 要和代码的比较方式配套：

- 代码比整个解码结果 $obj → payload 用标量 0
- 代码比对象属性 $obj->key → payload 用对象 `{"key":0}`

两种写法都必须用双引号；`{'key':0}` 不是合法 JSON，json_decode 会返回 null。
另外：省略 json_decode 的第二个参数会返回对象，此时必须写 $obj->key，
写成 $obj['key'] 会报 Error: Cannot use object of type stdClass as array（两版都致命）。

# array_search()绕过 与 is_array()绕过（PHP 7）

**函数**：is_array()，array_search()，count()，intval()

**作用**：

is_array()：判断是不是数组，是数组返回 true

```php
var_dump(is_array([1, 2, 3]));    // true
var_dump(is_array([]));           // true  ← 空数组也算
var_dump(is_array(['a' => 1]));   // true  ← 关联数组也算
```

array_search()：在一个数组中按照值找键，找到就返回键名，找不到就返回 false

关联数组：

```php
$arr = ['x' => 'Tom', 'y' => 'Jerry'];
array_search('Tom', $arr);      // "x" ← 键名是自定义的
array_search('Jerry', $arr);    // "y"
array_search('Nobody', $arr);   // false
```

索引数组：

```php
$nums = [10, 20, 30];
array_search(10, $nums);        // 0  ← 索引数组键名就是下标
array_search(20, $nums);        // 1
array_search(99, $nums);        // false
```

count()：计算一个数组中的元素有多少个

```php
count([1, 2, 3]);            // 3
count([]);                   // 0
count(['a' => 1, 'b' => 2]); // 2   ← 关联数组也数元素个数
```

intval()：取整函数

```php
echo intval(42);                     // 42
echo intval(4.7);                    // 4       ← 向零截断
echo intval('42');                   // 42
echo intval('+42');                  // 42
echo intval('1e10');                 // 10000000000
echo intval(0x1A);                   // 26
```

**例题**：

```php
<?php
if (!is_array($_GET['ctf'])) {
    exit();
}

$ctf = $_GET['ctf'];

for ($i = 0; $i < count($ctf); $i++) {
    if ($ctf[$i] === "admin") {
        echo "error";
        exit();
    }
    $ctf[$i] = intval($ctf[$i]);
}

if (array_search("admin", $ctf) === 0) {
    echo "flag";
} else {
    echo "false";
}
?>
```

**解法**：构造 get 请求 `?ctf[]=0` 可以绕过

因为 `?ctf[]=0` 传到后端，收到的是 `["0"]`，intval() 先把字符串 "0" 转成整数 0，
而 array_search() 默认用 == 松散比较，"admin" == 0 成立，
于是匹配到键为 0 的元素并返回 0，0 === 0 通过，输出 flag。
如果是 `array_search("admin", $ctf, true)`，第三个参数为严格比较，这招就没用了。

# strcmp()绕过（PHP 7）

**函数**：strcmp()，isset()

**作用**：

strcmp()：比较两个字符串，本质上是做减法

```text
strcmp($a, $b)
  $a > $b  →  返回正数（> 0）
  $a < $b  →  返回负数（< 0）
  $a == $b →  返回 0
```

isset()：判断一个变量是否已经声明

```php
$a = 0;
var_dump(isset($a));      // true
var_dump(isset($b));      // false ← 未定义

$c = null;
var_dump(isset($c));      // false ← 值为 null
```

```php
<?php
$password = "***************";
if (isset($_POST['password'])) {

    if (strcmp($_POST['password'], $password) == 0) {
        echo "flag";
        exit();
    } else {
        echo "Wrong password..";
    }
}
?>
```

**解法**：构造 POST 请求，body 为 `password[]=123`

因为 strcmp() 用数组和字符串作比较会出错并返回 NULL，NULL == 0 返回 true，
所以输出了 flag。

## switch绕过（PHP 7）

**函数**：strpos()

**作用**：

strpos()：在一个字符串中查找另一个字符串出现的位置，从 0 开始数

```php
strpos("hello world", "world");   // 6
strpos("hello world", "hello");   // 0   ← 在开头
strpos("hello world", "xyz");     // false
strpos("Hello", "hello");         // false ← 区分大小写
```

switch()：根据一个表达式的值跳转到不同的 case 分支

```php
$day = 3;

switch ($day) {
    case 1:
        echo "周一";
        break;
    case 2:
        echo "周二";
        break;
    case 3:
        echo "周三";
        break;
    default:
        echo "未知";
}
// 输出：周三
```

**例题**：

```php
<?php
$a = $_GET['a'] ?? '';  // 空合并运算符：a 存在且不为 NULL 则取其值，否则取空字符串

if (strpos($a, 'admin') === false) {
    exit("failall");
}

switch ($a) {
    case 1:
        echo "fail1";
        break;
    case 2:
        echo "fail2";
        break;
    case 3:
        echo "fail3";
        break;
    case 4:
        echo "flag";
        break;
    default:
        echo "failall";
        break;
}
?>
```

**解法**：

构造 GET 请求 `?a=4admin`
因为有 strpos()，字符串里必须出现 admin；而 switch() 的 case 是 == 松散比较，
4admin 与 4 相等，所以输出 flag。

# in_array()绕过（PHP 7 / PHP 8）

**函数**：in_array()：检查某个值是否存在于数组中

```php
$arr = ['apple', 'banana', 'cherry'];

in_array('banana', $arr);      // true
in_array('grape', $arr);       // false

in_array(20, [10, 20, 30]);    // true
in_array('20', [10, 20, 30]);  // true  ← 松散比较
```

**绕过方法**：

```php
<?php
$array=[1,2,3];
var_dump(in_array('aaa', $array)); // false
var_dump(in_array('1aa', $array)); // true
?>
```

默认是 == 松散比较，"1aa" 与 1 相等（PHP 7 成立，PHP 8 不成立）；
`in_array('1aa', $array, true)` 第三个参数为 === 严格比较，返回 false，严格比较无法绕过。

# intval()绕过（PHP 7 / PHP 8）

**函数**：intval()：取整函数

**绕过方法**：

该函数处理本身不能处理的字符串时并不会报错，直接返回 0；
对于数字开头、后面混有其他字符的字符串，只截取前面的数字部分
（如 intval("12abc") 得 12，intval("10oops") 得 10）；
在处理特殊数据（0x 前缀、八进制、科学计数法、数组、null 等）时有不同的处理结果。

```php
var_dump(intval("12abc"));              // int(12)
var_dump(intval("10oops"));             // int(10)
var_dump(intval("abc"));                // int(0)
var_dump(intval(array()));              // int(0)   空数组
var_dump(intval(array('foo','bar')));   // int(1)   非空数组
var_dump(intval(null));                 // int(0)
var_dump(intval(true));                 // int(1)
var_dump(intval('1e10'));               // int(10000000000) 再提一次
```

补充：第二个参数是进制

```php
var_dump(intval("0x1A"));        // int(0)   默认十进制，不认 0x 前缀
var_dump(intval("0x1A", 16));    // int(26)  指定 16 进制才认
var_dump(intval("0123", 0));     // int(83)  base 传 0 会按前缀猜进制
var_dump(intval("9999999999999999999"));  // int(9223372036854775807) 溢出截到 PHP_INT_MAX
```

# is_numeric()绕过（PHP 7 / PHP 8）

**函数**：is_numeric()

**作用**：

判断字符串是不是数字或数字字符串，全是数字则返回 true，有一个不是数字都返回 false

**绕过方法**：

当传入数字开头、字母在后的字符串时（1234a），参数可以绕过某些检测，从而走到下一步，
而 php 处理不同字符串时又会把两个字符串转换到同一类型去处理

**例题**：

```php
<?php
@$flag="**********";
@$temp = $_GET['p'];
if(is_numeric($temp)){
die("hahha");
}
else if($temp>2010) {
    echo $flag;
}
?>
```

**解法**：

要大于 2010 且还不能是数字，那么传入 2020a 既能绕过 is_numeric($temp)，
又满足 2020a > 2010，最终输出 flag。
（2020a > 2010 在 PHP 7 是数值比较；PHP 8 不把 2020a 当数字，走的是字符串字典序比较，
结果同样是 true，所以这题两版都能过。）

## bool欺骗（PHP 7 / PHP 8）

依据相等矩阵第 1 条：一边是 bool，两边都转 bool 再比。
字符串只有 "" 和 "0" 转 false，其余都转 true。

```text
true  == '0'      // true == false   → false
true  == '0.0'    // true == true    → true
false == 'admin'  // false == true   → false
false == '0'      // false == false  → true
false == ''       // false == false  → true
null  == ''       // false == false  → true
null  == 'admin'  // false == true   → false
```

当存在 json_decode 和 unserialize 的时候，部分结构会被解释成 bool 类型，
攻击者因此能控制比较的一边是 true。

# json_decode 示例（PHP 7 / PHP 8）

```php
<?php
$json_str = '{"user":true,"pass":true}';
$data     = json_decode($json_str, true);   // 第二参数 true = 返回关联数组

var_dump($json_str);       // string(25) ← 原字符串没有被修改
var_dump($data);           // array(2) { ["user"]=>bool(true) ["pass"]=>bool(true) }
var_dump($data['user']);   // bool(true) ← 真正的布尔值，不是字符串 "true"

if ($data['user'] == 'admin' && $data['pass'] == 'security')
{
    print_r('logined in as bool'."\n");
}
// 输出为 logined in as bool

var_dump($data['user'] === 'admin');   // bool(false) ← 换成严格比较就过不了
?>
```

# unserialize示例（PHP 7 / PHP 8）

```php
<?php
$unserialize_str  = 'a:2:{s:4:"user";b:1;s:4:"pass";b:1;}';
$data_unserialize = unserialize($unserialize_str);

var_dump($data_unserialize);         // array(2) { ["user"]=>bool(true) ["pass"]=>bool(true) }
var_dump($data_unserialize['user']); // bool(true)

if ($data_unserialize['user'] == 'admin' && $data_unserialize['pass'] == 'security')
{
    print_r('logined in unserialize'."\n");
}
// 输出结果为 logined in unserialize

var_dump($data_unserialize['user'] === 'admin');   // bool(false) ← 严格比较过不了
?>
```

注意：序列化串里 `s:4:"user"` 的 4 必须等于 user 的实际字节数，
写错就解析失败返回 false（实测 `s:5` 会得到 bool(false)），后面取值全是 null。

# 十六进制转换（PHP 7 / PHP 8）

网上流传的这段是错的，实测两版都为 false：

```text
"0x1e240" == "123456"   // false
"0x1e240" == 123456     // false
"0x1e240" == "1e240"    // false
```

PHP 把字符串转数字时不认 0x 前缀（is_numeric("0x1A") 也是 false）。
0x1A 只有写成不带引号的字面量才是 26；字符串要转 26 得写 intval("0x1A", 16)。

# %00 截断（PHP 5 及更早；PHP 7 / PHP 8 已失效）

**原理**：

早期 PHP 的字符串在 C 层用 \0 结尾，虽然 PHP 自己带长度，但一部分函数（文件系统、
ereg、strcmp 等）会把字符串交给 C 函数处理，遇到 \0 就当字符串结束。

**典型利用**：白名单或后缀检查用 `"shell.php\0.jpg"`，检查看到 .jpg，文件系统却只看到 shell.php。

# 参考

- <https://www.cnblogs.com/Mrsm1th/p/6745532.html>
- <https://blog.csdn.net/nobugnomoney/article/details/124944096>













