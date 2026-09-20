<div align="center">

# 烟花模拟器

一个可以模拟各种烟花效果的网页

它可以展示各种绚丽多彩的烟花效果 并让人仿佛置身于真实烟花的绚丽世界之中

<img src="./Image_Preview.png" alt="主界面" style="zoom:35%;" />

</div>

## 预览

- [https://nianbroken.github.io/Firework_Simulator/](https://nianbroken.github.io/Firework_Simulator/ "https://nianbroken.github.io/Firework_Simulator/")

## 配置修改

### 修改默认背景

编辑 `js\app\config.js` 文件的第10行和第11行。

当 `mode` 为 `none` 时，不使用默认背景。

当 `mode` 为 `image` 时，在 `value` 中填入图片路径或地址，例如 `./Image_Preview.png`。

当 `mode` 为 `style` 时，在 `value` 中填入完整的 CSS 背景样式字符串，例如 `linear-gradient(#020024, #090979, #00d4ff)`。

### 修改文字烟花内容

编辑 `js\app\config.js` 文件的第7行。

### 修改是否默认打开文字烟花

编辑 `js\app\store.js` 文件的第78行，可选值为 `true` 或 `false`。

## 许可证

`Copyright © 2022 NianBroken. All rights reserved.`

本项目采用 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0 "Apache-2.0") 许可证。简而言之，你可以自由使用、修改和分享本项目的代码，但前提是在其衍生作品中必须保留原始许可证和版权信息，并且必须以相同的许可证发布所有修改过的代码。

## 特别感谢

- [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb)

- [haodong108/fireworks-2023](https://gitee.com/haodong108/fireworks-2023)

## 恰饭

[Great-Firewall](https://nianbroken.github.io/Great-Firewall/) 好用的 VPN

[Ciii](https://ciii.klaio.top/) Codex 中转

[Aizex](https://aizex.klaio.top/) ChatGPT 镜像站

以上绝对都是性价比最高的。

## 其他

欢迎提交 `Issues` 和 `Pull requests`

## 烟花秀编排与许愿

- 顶部日历按钮打开「烟花秀编排」：在时间轴上添加、删除、调整节目，可设置时间点、烟花类型、大小、颜色、发射位置，以及文字烟花开关与文字内容。
- 节目单会自动保存到本地，刷新后可继续编辑；也支持导出为 JSON 文件或从文件导入。
- 点击「播放烟花秀」后按时间轴自动依次绽放，播放中可暂停、继续、跳过当前节目，底部显示当前节目、进度与总时长，结束后自动回到普通模式。
- 顶部爱心按钮打开「许愿」：输入祝福语即以文字烟花在天空绽放，侧边保留祝福历史并支持清空。
- 编排与祝福历史使用独立的本地存储键，不会影响原有设置与记录；手机端通过顶部触控区操作。
