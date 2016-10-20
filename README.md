# aics

A meteor code manager command line tool.

[![Build Status](https://travis-ci.org/fami2u/aics.svg?branch=master)](https://travis-ci.org/fami2u/aics)
[![codecov](https://codecov.io/gh/fami2u/aics/branch/master/graph/badge.svg)](https://codecov.io/gh/fami2u/aics)
[![Dependency Status](https://dependencyci.com/github/fami2u/aics/badge)](https://dependencyci.com/github/fami2u/aics)
[![Known Vulnerabilities](https://snyk.io/test/github/fami2u/aics/badge.svg)](https://snyk.io/test/github/fami2u/aics)

### Background

如何提高开发者的开发效率？我们一直在思考。我们的解决方法是：让代码复用更容易且封装精良，粒度适中，适合模块化开发。基于这个想法并结合业务实践，我们开发了aics 系统。aics不单纯是一个cli命令行客户端，它还包括大量可复用的代码包资源库 http://aics.fami2u.com 。对比npm包，aics具有更快的开发效率，因为它比npm在代码控制的粒度上更大，且源代码可随时查看并修改，实时刷新。对于很多开发者而言，可能业务逻辑上的开发效率很低，针对于此，我们封装了大量的业务逻辑，微信红包，支付宝支付，微信支付，jpush，甚至整套的购物流程，整套的后台数据管理等，更多使用广泛的组件也在积极的积攒中，使用的时候只需要aics add 对应的包名即可使用。我们在资源库中，我们创建了不同的技术栈，每一个技术栈对应于一种目录或开发规范，这样就能保证任何有用的代码都可以有适合的栈去存放。不远的将来，aics资源库会积累很多有价值的组件，逐步形成一个社会化贡献的你的私人代码资源库。aics更多有意思的地方，一起来探索吧。

###  Installation

```
npm install -g aics
```

## Usage



## API

```
  Commands:

    adduser                登录aics cli
    register               创建aics账户
    info                   显示 aics cli 登录用户信息
    init <name>            生成aics配置文件
    add <name>             添加 aics 代码包 代码包地址: http://aics.fami2u.com/
    start <name> <stack>   根据选定的技术栈生成项目 技术栈地址: http://aics.fami2u.com/stacks
    publish <name>         发布 aics 组件
    addfile <file> <name>  添加文件到组件
    rm <name>              删除安装的组件
    update <name>          更新项目依赖

```

### aics -V

```
Usage: aics -V
  显示当前 aics 版本号
```

### `aics --help`

```
Usage: aics --help
  显示 aics 所有的命令行
```

### `aics adduser`

```
  Usage: adduser [options]
  登录aics cli

  Options:
    -h, --help  output usage information

  Examples:
    $ aics adduser
```

### `aics info`

```
  Usage: info [options]
  显示 aics 登录用户信息

  Options:
    -h, --help  output usage information

  Examples:
    $ aics info
```

### `aics init`

```
  Usage: init [options]
  生成aics配置文件

  Options:
    -h, --help            output usage information

  Examples:
    $ aics init [name] # 生成一个 名为 name 代码包项目 
```

### `aics add`

```
  Usage: add [options] [packagename]
  添加名为 packagename 的 aics 代码包 代码包地址: http://aics.fami2u.com/

  Options:
    -h, --help  output usage information

  Examples:
    $ aics add fami:readme
```

### `aics update`

```
  Usage: update [options]

  更新项目或代码包依赖

  Options:
    -h, --help        output usage information

  Examples:
    $ aics update [name] # 更新名为 [name] 的代码包依赖的代码包的版本
```

### `aics publish`

```
  Usage: publish [options]
  发布aics项目或组件

  Options:
    -h, --help            output usage information

  Examples:
    $ aics publish [name] # 发布名为 [name] 的 aics 代码包
```

### `aics addfile` 

```
  Usage: addfile [options]
  添加文件到组件

  Options:
    -h, --help           output usage information

  Examples:
    $ aics addfile README.md depot # 添加文件README.md 到 depot 组件包
```
### `aics rm` 

```
  Usage: rm <name>
  删除安装的组件

  Options:
    -h, --help           output usage information

  Examples:
    $ aics rm depot #  删除安装的组件
```
### `aics start` 

```
  Usage: start [options]
  使用技术栈模版创建项目

  Options:
    -h, --help           output usage information

  Examples:
    $ aics start app meteor # 使用meteor技术栈模版创建app项目
```
## 配置文件示例

aics 初始化 代码包配置文件

```
> 文件结构：

├── ROOT_PATH/
|   ├── .aics/
|   |   └── [x].depot.json
|   |   └── packages.json
|   ├── ...

> 配置文件：
x.depot.json

{
    "stack": "",
    "name": "",
    "version": "0.0.1",
    "summary": "",
    "git": "",
    "readme": "README.md",
    "depend": {},
    "packages": [],
    "npms": {},
    "files": []
  }
```
##Todo
- [x] 登录 cli 系统
- [x] init生成基础配置文件
- [x] 发布包
- [x] 安装包
- [ ] 更新包
- [ ] 去除无用的npm包
- [x] 添加代码覆盖率测试
- [x] 添加ci
- [ ] 添加运行截图，让用户更直观的发现需要的包


## FeedBack
使用过程中如果遇到问题 , 请提交 [ISSUE](https://github.com/fami2u/aics-docs/issues)

### License

MIT