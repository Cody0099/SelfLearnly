# 应用图标

请在此目录下添加以下图标文件：

1. `icon.ico` - Windows应用图标（建议尺寸256x256像素）
2. `icon.icns` - macOS应用图标（可使用iconutil工具从icns集合生成）
3. `icon.png` - Linux应用图标（建议尺寸512x512像素）

这些图标文件将在应用打包过程中使用。如果没有这些文件，打包工具会使用默认图标。

## 图标转换工具

- Windows: 可以使用在线工具如 https://convertico.com/ 转换PNG为ICO
- macOS: 可以使用iconutil命令行工具创建ICNS文件
- 多平台: 可以使用Electron图标生成器如 `electron-icon-maker`

图标文件准备好后，请删除此README.txt文件。 