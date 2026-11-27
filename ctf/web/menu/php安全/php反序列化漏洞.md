# python反序列化漏洞
## 序列化
在程序运行时，产生的状态都存在内存中（变量、对象属性、容器内容等）。如果程序停止运行，这些数据就消失了，对于很多程序来说，重建这些状态需要付出很高的代价，可能是重新发起上千次的网络请求，或是重新跑几小时的计算，所以为了下次启动时能接着用，就需要把这些内存中的状态保存到硬盘中，这个将内存中的对象转为一段序列（文本或字节流）的过程就叫做序列化。这段序列可以直接存入硬盘，但写入硬盘也只是它的用途之一。
## 反序列化
反序列化就是序列化的相反操作，将序列重新转为内存中的对象，这个还原的过程就叫反序列化。
## 反序列化漏洞
反序列化时，程序会按序列里的内容去构造对象、调用东西。所以只要攻击者控制了序列，就能让程序按他的指定执行。
## php反序列化漏洞
原理：攻击者构造了恶意的序列，程序没有校验。反序列化了该序列，导致构造出来的对象是攻击者可控的，所以本质是对象注入
## 函数：serialize()
作用：将对象序列化
```php
<?php
class flag{
public $username='admin';
}
$user=new flag();
echo serialize($user);
?>
```
输出为：O:4:"flag":1:{s:8:"username";s:5:"admin";} 
	//O : 类名长度 : "类名" : 属性个数 : { s:键长度:"键" ; s:值长度:"值" ;}
## 函数：unserialize()
作用：将序列反序列化
```php
<?php
class flag {
public $username='guest';
}
$flag = 'O:4:"flag":1:{s:8:"username";s:5:"admin";}';
$o = unserialize($flag);
echo $o->username;      // 取出你要的那个值
?>
```
输出为：admin //可以发现，username的属性被覆盖成了admin
## 访问控制
PHP 对属性或方法的访问控制，是通过在前面添加关键字 public（公有），protected（受保护）或 private（私有）来实现的。
public（公有）：公有的类成员可以在任何地方被访问。
protected（受保护）：受保护的类成员则可以被其自身以及其子类和父类访问。
：私有的类成员则只能被其定义所在的类访问。
访问控制修饰符不同，序列化后属性的长度和属性值会有所不同
public：属性被序列化的时候属性值会变成 属性名		O:4:"flag":1:{s:8:"username";s:5:"admin";}
protected：属性被序列化的时候属性值会变成 \x00*\x00属性名	O:4:"flag":1:{s:11:"\x00*\x00username";s:5:"admin";}
private：属性被序列化的时候属性值会变成 \x00类名\x00属性名	O:4:"flag":1:{s:14:"\x00flagusername";s:5:"admin";} 
//注意：\x00为空字符，正常不可见（这里用\x00是为了方便说明），且手动无法添加，需要脚本输出，所以生成受保护和私有类型的脚本和公有类型的不一样。
## 函数：__construct()
作用：构造函数，在实例这个类的时候自动调用这个函数，利用构造函数我们可以生成protected（受保护）和private（私有）类型的序列
```php
<?php
class flag{
protected $user;
private $password;
public function __construct(){
$this -> user = 'admin';
$this -> password = '123456';
}
}
$flag=new flag();
echo serialize($flag);
?>
```
输出为：O:4:"flag":2:{s:7:"*user";s:5:"admin";s:14:"flagpassword";s:6:"123456";}//注意：这里的user长度为7，flagpassword是\x00类名\x00属性名，所以长度是14
## 魔术方法：

```
__construct()            //类的构造函数，创建对象时触发
__destruct()             //类的析构函数，对象被销毁时触发
__call()                 //在对象上下文中调用不可访问的方法时触发
__callStatic()           //在静态上下文中调用不可访问的方法时触发
__get()                  //读取不可访问属性的值时，这里的不可访问包含私有属性或未定义
__set()                  //在给不可访问属性赋值时触发
__isset()                //当对不可访问属性调用 isset() 或 empty() 时触发
__unset()                //在不可访问的属性上使用unset()时触发
__invoke()               //当尝试以调用函数的方式调用一个对象时触发
__sleep()                //执行serialize()时，先会调用这个方法
__wakeup()               //执行unserialize()时，先会调用这个方法
__toString()             //当反序列化后的对象被输出在模板中的时候（转换成字符串的时候）自动调用
```
