<div align="center">
 <h1>Workpaper</h1>
<a target="_blank" href="https://github.com/Jarvay/Workpaper/actions/workflows/build.yml">
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

 <img src="https://img.shields.io/badge/platform-Windows%20%7C%20MacOS%20%7C%20Linux-lightgreen" alt="" />
</div>

Translated by Google Translate

## A software that changes wallpaper regularly. You can set different wallpapers at different time periods.

For example, display the wallpaper [fishing] on working days from 9:00-10:30,<br>
10:31-11:59 Show wallpaper [What to eat today],<br>
Starting from 12:00 [dry rice],<br>
Display [I will not be working tomorrow] all day on Friday.

### Support functions

- Support Mac|Windows|Linux
- Support dynamic and static wallpapers
- Support different screens to display different wallpapers
- Supports displaying fixed wallpapers by time period or changing wallpapers regularly

### Instructions

1. Download and install from [release](https://github.com/Jarvay/Workpaper/releases)
2. After starting the software, you need to find the software icon in the tray, right-click and select [Display Interface]
3. Click [Create], select the cycle as needed and confirm.
   For example, if you want to use the same rules every day, select them all. If the weekdays and weekends are different, create one for Monday to Friday first, and then create one for Saturday and Sunday.
4. After step 3, the created data will appear in the list, click [View], then click [Create]

- Time period: the time period when the rule takes effect. For example, if you want to display the wallpaper between 9:00-10:30, select 9:00-10:30
- Wallpaper type: Picture | Video
- type:
  - Fixed wallpaper: Fixed display of the wallpaper selected below during the time period of your choice
    - Screen [n]: single monitor or multiple screens but do not need to display different wallpapers on each screen. Setting screen 1 is sufficient. If multiple screens with different wallpapers are required, [Add screen] and then set the wallpaper as needed.
  - Automatic change: Automatically change the wallpaper in the folder you choose within the time period you choose.
    - picture:
      - Random switching: Randomly display the pictures in the folder of your choice
      - Randomize each screen: As the name suggests, if it is not turned on, the same picture will be displayed on multiple screens.
      - Replacement interval: Wallpaper replacement interval
    - video:
      - The videos in the folder will be played in sequence and in a loop
      - Wallpaper directory: The pictures or video wallpapers in it will be read, but those in subfolders will not be read.
