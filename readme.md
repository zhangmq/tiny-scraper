# tiny-scraper
一个轻量级的数据抓取工具，编写这个项目起因是个人娱乐，爬取一些网站数据，顺便造的轮子，很糙，不过应该还算好用。


## 特性
* 请求自动排队，请求并发数，请求频率可配置
* 可基于路由匹配url编写特定页面的数据提取逻辑，创建深层请求

## 依赖
* flyd
* transducers.js
* path-to-regexp

## 安装
```
npm install tiny-scraper
```

## 示例
[Demo](./example/example.js)