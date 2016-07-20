---
layout: post
title: 命令行
category: note
tags: commanders
---

## Commanders

```

    deploy [options] <project> <key>      一键部署应用到服务器
    setup                                 初始化私有服务器环境及依赖软件
    push                                  部署项目到私有服务器
    logs [options]                        打印服务器日志
    mongo                                 连接远程数据库
    adduser                               登录 aics CLI
    whoami                                显示 aics 登录用户信息
    init [options]                        生成aics配置文件
    add [name]                            添加 aics 代码包 代码包地址: http://code.fami2u.com/
    update [options]                      更新项目或代码包依赖
    publish [options]                     发布aics项目或组件
    addfile [options]                     添加文件到组件
    lsfile [options]                      显示指定代码包中的文件

```

- ### `aics -v`

```
Usage: aics -v
  显示当前 aics 版本号

```

- ### `aics --help`

```
Usage: aics --help
  显示 aics 所有的命令行

```

- ### `aics deploy`

```
Usage: deploy [options] <project> <key>
Deployment this project to fami2x.com microhost

  Options:
    -h, --help                                    output usage information
    -m, --mobile-settings <mobile-settings.json>  Set mobile-settings from json file
    -s, --server-only                             server only
    -e, --env <env.json>                          Set environment variables from json file
    -d, --debug                                   debug mode

  Examples:
    $ aics deploy appName  # Deployment to http://appName.aics.cn 
    $ aics deploy appName --env env.json
```

- ### `aics setup`

```
  Usage: setup [options]
  Configuration runtime environments on private server

  Options:
    -h, --help  output usage information

  Examples:
    $ aics setup #  configuration your server

```

- ### `aics push`

```
  Usage: push [options]
  Deployment a project to private server

  Options:
    -h, --help                                    output usage information
    -m, --mobile-settings <mobile-settings.json>  Set mobile-settings from json file
    -s, --server-only                             server only
    -d, --debug                                   debug mode

  Examples:
    $ aics push  # config package.js 
    $ aics push
```

- ### `aics logs`

```
  Usage: logs [options]
  Print logs on server

  Options:
    -h, --help           output usage information
    -l, --lines <lines>  output the last N lines, instead of the last 50 by default

  Examples:
    $ aics logs  
    $ aics logs -t 100
```

- ### `aics mongo`

```
  Usage: mongo [options]
  Connection to a remote mongo database

  Options:
    -h, --help  output usage information

  Examples:
    $ aics mongo
```

- ### `aics adduser`

```
  Usage: adduser [options]
  登录aics cli

  Options:
    -h, --help  output usage information

  Examples:
    $ aics adduser
```

- ### `aics whoami`

```
  Usage: whoami [options]
  显示 aics 登录用户信息

  Options:
    -h, --help  output usage information

  Examples:
    $ aics whoami
```

- ### `aics init`

```
  Usage: init [options]
  生成aics配置文件

  Options:
    -h, --help            output usage information
    -p, --project <name>  generate aics project conf
    -e, --example <name>  generate project from example project conf

  Examples:
    $ aics init -p [name] # 创建新的aics项目
    $ aics init -e [name] # 根据 name 生成一个项目
    $ aics init [name] # 生成一个 名为 name 代码包项目 
```

- ### `aics add`

```
  Usage: add [options] [packagename]
  添加名为 packagename 的 aics 代码包 代码包地址: http://code.fami2u.com/

  Options:
    -h, --help  output usage information

  Examples:
    $ aics add fami:readme
```

 - ### `aics update`

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

- ### `aics publish`

```
  Usage: publish [options]
  发布aics项目或组件

  Options:
    -h, --help            output usage information
    -p, --project <name>  发布解决方案（项目）

  Examples:
    $ aics publish -p [name] # 发布名为 [name] 的 aics 项目
    $ aics publish [name] # 发布名为 [name] 的 aics 代码包
```

 - ### `aics addfile` 

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

 - ### `aics lsfile`

```
  Usage: lsfile [options]
  显示指定代码包中的文件

  Options:
    -h, --help           output usage information
    -t, --target <name>  组件名称

  Examples:
    $ aics lsfile -t depot # 显示 depot 代码包中的文件
```

## 配置文件示例

- aics 部署项目到私有服务器

```

    "server": {
        "host": "182.92.11.131",
        "username": "root",
        "//password": "password",
        "//":" or pem file (ssh based authentication)",
        "//": "WARNING: Keys protected by a passphrase are not supported",
        "pem": "~/.ssh/id_rsa",
        "//":" Also, for non-standard ssh port use this",
        "sshOptions": { "port" : 22 },
        "//":" server specific environment variables",
        "env": {}
    },
    "setup": {
        "//": "Install MongoDB on the server. Does not destroy the local MongoDB on future setups",
        "mongo": true,
        "//": "Application server path .  must in /usr /opt /home /alidata directory.",
        "path": "/usr/local/meteorup"
    },
    "deploy": {
        "//": "Application name (no spaces).",
        "appName": "best",
        "//": "Configure environment",
        "//": "ROOT_URL must be set to your correct domain (https or http)",
        "env": {
            "YJENV": "test", // customize environment
            "MONGO_URL": "mongodb://127.0.0.1:27017/best",
            "PORT": 8181,
            "ROOT_URL": "http://182.92.11.131:8181"
        }
    }

```

- aics 初始化项目配置文件

```
├── ROOT_PATH/
|   ├── .aics/
|   |   └── project.json
|   |   └── packages.json
|   ├── ...
```

```
project.json

{
  "name": "",
  "stack": "",
  "type": "project",
  "version": "0.0.1",
  "summary": "",
  "git": "",
  "documentation": "README.md",
  "dependencies": {},
  "packages": {},
  "npm": {}
}
```

- aics 初始化 代码包配置文件

```
├── ROOT_PATH/
|   ├── .aics/
|   |   └── [x].depot.json
|   |   └── packages.json
|   ├── ...
```

```
[x].depot.json

{
    "stack": "",
    "name": "",
    "version": "0.0.1",
    "summary": "",
    "git": "",
    "documentation": "README.md",
    "dependencies": {},
    "packages": [],
    "npm": {},
    "files": []
  }
```

## FeedBack
使用过程中如果遇到问题 , 请提交 [ISSUE](https://github.com/fami2u/aics-docs/issues)


