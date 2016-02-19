# aics

 配合 codedepot.fami2u.com 代码仓库使用的代码包管理工具

(optional)使用[nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows)管理本地nodejs版本

### 安装aics

AICS的命令行工具依赖nodejs 目前测试 0.10.x 及 4.x版本可以正常运行

```
$npm install aics -g

```

### aics常用命令

* 查看当前aics版本 `stable`

```
$ aics -v
```

* 列出所有命令 `stable`

```
$ aics -h
```

* 当前帐户信息 `stable`

```
$ aics -u
```

* 初始化当前目录为aics项目 `stable`
 
> 可选参数 －p init as package
> 可选参数 －P init as project
> --example username:projectName    根据项目模版创建项目，可用项目模版 http://codedepot.fami2u.com/projects
> 没有可选参数时默认创建 aics package 项目

```
$ aics init $name

```

* 为当前aics项目添加一个代码包 `stable`

>访问codedepot.fami2u.com 获取更多代码包

```
$ aics add $package-name
```

* 根据配置文件更新代码包 `stable`

>没有参数的情况下是更新 aics项目 的依赖，即当前目录下的$proj.project.json。指定文件名称或-all参数会在.aics目录下寻找对应的$package.depot.json后缀文件进行更新

```
$ aics update [$package-name|-all]
```

* 登录aics客户端 `stable`

> 设置当前的aics帐号，只有在需要使用代码仓库时使用

```
$ aics adduser username
```

* 发布代码包 `stable`

> 发布之后可以在codedepot.fami2u.com找到

```
$ aics publish [package-config]
```

* 删除远程代码包 `stable`

> 删除在codedepot.fami2u.com的代码包

```
$ aics remote-del $package-name
```

* 删除本地已安装代码包 `stable`


```
$ aics remove $package-name
```

* 清除代码包缓存 `stable`

```
$ aics clear
```

* 给创建的代码包添加文件 `stable`

```
$ aics addfile $file|$dir
```

* 列出创建的代码包包含的文件 `stable`

```
$ aics lsfile $package-name
```


### aics项目下会包含一些文件结构说明

```
ROOT_DIR/ 
.aics /                       代码包配置列表及相关文件存放
.aics／project.json        	  项目配置文件，管理代码包依赖关系
.aics/tmp                     临时目录，存放安装时的临时代码文件
.aics/$package-name.depot.json 代码包配置例子文件,可以包含多个
.aics/packages.json           已安装的所有代码包及版本信息
```

### AICS的配置文件详解

> 配置文件不支持特殊字符
> 配置文件不支持注释

```
DIR_ROOT/project.json
{
    "name": "项目名称",
    "prototype": "栈名称",
    "version": "0.0.1",
    "summary": "项目的简单描述",
    "git":"项目的GIT地址",
    //代码包的依赖关系
    "dependencies": {
			"$package-name":"v0.0.1"
    }
}
```
```

DIR_ROOT/.aics/example-package.json

{
    "prototype": "原型名称",
    "name": "$package-name",
    "version": "0.0.1",
    "summary": "代码包的简单描述",
    "git":"代码包的GIT地址",
    "documentation": "说明文件地址 README.md",
    "dependencies": {
		'代码包的依赖关系'
    },
    "files": [
        "可供下载的文件，未下载files中的文件不会被下载"
            ],
    //数据库切片
    "database":{
    	//表或集合名称
    	"users":{
    		//字段名及类型
    		"uid":"int32",
    		"createAt":"date",
    		"nickname":"string"
    	}
    }
}

```

### CODE_DEPOT的说明
目前codedepot存在很多问题，aics只是尝试解决这些问题迈出的第一布，还需要很多很多的帮助参与到这个项目。
通过几个aics的关键词解释aics－codedepot这个系统的原理

**数据库**：使用aics的第一步，选择项目使用的数据库，所有完整项目抽象为最基础的就是数据模型。提供了基本的三种数据库方式MONGODB、mysql、leancloud
**栈（原型）**：在depot中可以根据使用的语言版本建立不同的原型可以理解成：数据库＋编程语言＋使用框架 ，或者说就是使用的开发环境。
**代码包**：就是在不同原型（开发环境）下的代码集合。

这个版本的aics-codedepot的结构就是这样简单，为了在最大程度上开发的自由支持。
当然为了能够进一步优化和我们的目标，我们对这个体系加入了一些简单的规则：

**文件唯一**：在同个原型下文件名称是不能重复的，publish时会提示。
**版本号**：depot里虽然没有版本控制的功能，但是对于版本号是有管理的，会保存每个版本的副本，在项目中引用可以指定版本号，每次的发布要求版本号必须要更新。

当然，为了要实现更好的管理代码及最大程度复用的目标，还需要更多的参与者能够贡献好的解决方法。可以持续关注FAMI2U的最新动向和BLOG，参与AICS项目的方式参考FAMI2U的开源项目流程。

### AICS的前世今生
AICS项目启动大概已经一年左右了，受到很多人的关注，包括和创家、北大孵化器、葡萄园等一些组织的支持。为我们提供了大量的项目来验证整个系统。目前这个版本还没有版本号，也希望大家来提建议（我们都是魔兽死忠FANS～其他产品都用里面的命名，哈哈哈）。在这之前AICS共有两个版本：alpha／dora。这个两个版本实现了两个aics体系里比较重要的功能点：alpha－自动化部署、同步维护／dora－数据库切片式管理，但是这两个版本只能支持PHP＋mysql的开发环境，后边会根据当前版本的实际使用情况将这些重要功能并入AICS。

### AICS和其他代码管理项目
AICS的alpha于2014年2月份开始投入使用，由数十个项目实际应用。在最初阶段，系统设计本身是很复杂的，我们大概写了60页的WORD说明书给项目方，但是主要的方式结构基本已经在这个阶段定型。15年初我们开始接触js全栈的项目，参考了很多NPM项目，7月份左右开始接触METEOR／DOCKER，在这个过程中能够感觉到AICS的设计，并不是偶然的事情，只是一个趋势，会有这样的一些项目。
与NPM／METEOR/DOCKER的不同方向
AICS未来应该不会限定某一种开发语言。FAMI2U这个组织的目标是IT无边界化，更关注的是技术的项目转化和开发者的职业规划，我们会在如何辅助这个目标上进行探索：提高开发者的个人能力／让开发者不依赖于企业或工作。


```
//AICS的发展方向
Workflow工作流管理
Devops工程自动化
CI 持续集成
```


### changeLog

* 0.0.5 更新内容
增加了aicsd 命令用于调试开发 设置 env.DEBUG = 1 

* 0.0.4 更新内容
更新保存代码包 使用阿里云的OSS服务
更新数据库使用方式 使用阿里云MONGODDB服务


======================================================================

### 关于 @ FAMI2U
FAMI2U 是FAMI发起的一个开发者组织，目标是为实现IT无边界化而努力，解放和发展开发者的生产力，从而促进开发者对于其他行业的贡献，使开发者成为推动变革的中坚力量。 FAMI2U的更多项目可关注 ：https://github.com/fami2u


