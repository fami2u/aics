  
##aics

A meteor code manager command line tool.

[![Build Status](https://travis-ci.org/fami2u/aics.svg?branch=master)](https://travis-ci.org/fami2u/aics)
[![Coverage Status](https://coveralls.io/repos/github/fami2u/aics/badge.svg)](https://coveralls.io/github/fami2u/aics)

## 命令

```
    adduser                               登录 aics CLI
    info                                  显示 aics 登录用户信息
    init [options]                        生成aics配置文件
    add [name]                            添加 aics 代码包 代码包地址: http://aics.fami2u.com/
    update [options]                      更新项目或代码包依赖
    publish [options]                     发布aics项目或组件
    addfile [options]                     添加文件到组件
```

### `aics -V`

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
  添加名为 packagename 的 aics 代码包 代码包地址: http://code.fami2u.com/

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
    -a, --all <path>  update all packages in .aics/packages.json

  Examples:
    $ aics update -a # 更新项目依赖的代码包的版本
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
    -f, --file <path>    文件名或目录
    -t, --target <name>  添加到的组件名称

  Examples:
    $ aics addfile -f README.md -t depot # 添加文件README.md 到 depot 组件包
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
- [ ] 添加代码覆盖率测试
- [ ] 添加ci
- [ ] 添加运行截图，让用户更直观的发现需要的包


## FeedBack
使用过程中如果遇到问题 , 请提交 [ISSUE](https://github.com/fami2u/aics-docs/issues)


