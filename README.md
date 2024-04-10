<div align="center">
  <h1>Workpaper</h1>
<a target="_blank" href="https://github.com/siyuan-note/siyuan/actions/workflows/build.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/Jarvay/Workpaper/build.yml?style=flat-square" alt="">
</a>
  <a href="https://github.com/Jarvay/Workpaper/actions">
    <img src="https://github.com/Jarvay/Workpaper/actions/workflows/main.yml/badge.svg" alt="">
  </a>
  <a href="https://github.com/Jarvay/Workpaper/releases">
    <img src="https://img.shields.io/github/downloads/Jarvay/Workpaper/total.svg?style=flat-square" alt="">
  </a>
  <a href="https://github.com/Jarvay/Workpaper/releases/latest">
    <img src="https://img.shields.io/github/release/Jarvay/Workpaper.svg?style=flat-square" alt="">
  </a>

  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20MacOS%20%7C%20Linux-lightgrey" alt="" />
</div>

## 一个定时换壁纸的软件，你可以在不同时间段设置不同的壁纸。

比如在工作日9:00-10:30显示壁纸[摸鱼中]，<br>
10:31-11:59显示壁纸[今天吃什么]，<br>
12:00开始显示[干饭]，<br>
在周五整天显示[老子明天不上班]。

### 支持功能

- 支持Mac|Windows|Linux
- 支持动态及静态壁纸
- 支持不同屏幕显示不同壁纸
- 支持按时间段显示固定壁纸或定时更换壁纸

### 使用方法

1. 从[release](https://github.com/Jarvay/Workpaper/releases)中下载并安装
2. 软件启动后需要在托盘找到软件图标，右键选择【显示界面】
3. 点击【创建】，根据需要选择周期然后确定。
   例如你想每天都使用同样的规则就全选，工作日和周末显示不一样就先创建一条周一到周五的，再创建一条周六周日的。
4. 第3步后列表会出现创建的数据，点击【查看】，然后点击【创建】
   - 时间段：规则生效的时间段，比如你要在9:00-10:30显示壁纸[摸鱼中]，就选择9:00-10:30
   - 壁纸类型：图片|视频
   - 类型：
      - 固定壁纸：在你选择的时间段内固定显示下面选择的壁纸
         - 屏幕[n]：单显示器或者多屏但不需要各个屏幕显示不同壁纸的设置屏幕1即可，需要多屏不同壁纸的则【添加屏幕】然后按需设置壁纸
      - 自动换：在你选择的时间段内自动更换你选择的文件夹内的壁纸
        - 图片：
            - 随机切换：随机显示选择你选择的文件夹内的图片
            - 屏幕各自随机：顾名思义，不开启则多屏时显示同一张图片
            - 更换间隔：壁纸更换间隔
        - 视频：
            - 会按文件夹内的视频顺序并循环播放
        - 壁纸目录：会读取里面的图片或视频壁纸，不读取子文件夹内的
        

