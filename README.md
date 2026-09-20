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

## 烟花秀与许愿

顶部控制栏新增两个入口：

- **烟花秀编排**：在时间轴上添加、删除、上移/下移节目；每个节目可设置时间点、烟花类型、大小、颜色、发射位置和绽放高度，并支持文字烟花及文字内容。节目单可命名、新建、删除，自动保存在浏览器本地，刷新后可继续编辑；也支持导出为 JSON 文件与从文件导入。
- **播放**：编排面板点击「播放烟花秀」后，按时间轴依次绽放，底部显示节目单名称、当前节目、进度条与总时长，可暂停/继续、跳过当前节目或停止，全部放完后自动回到普通模式。
- **许愿**：观众输入祝福语（最多 12 个字）后以文字烟花在天空绽放，侧边栏展示祝福列表、保留历史记录，支持「再放」与「清空」。

编排与祝福记录与原有设置共用 `cm_fireworks_data` 本地存储，旧数据自动兼容。

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
