# StudyFlow Web部署指南

本文档介绍如何将StudyFlow从Electron桌面应用转变为可在网页浏览器中运行的Web应用，并正确部署到GitHub Pages或Cloudflare Pages。

## 基本概念说明

StudyFlow原本是一个基于Electron的桌面应用程序，它的工作方式与网页应用有根本区别：

- **Electron应用**：集成了Node.js环境，可以直接访问文件系统、执行系统命令等
- **Web应用**：运行在浏览器沙盒环境中，有严格的安全限制，无法直接访问文件系统

因此，要将StudyFlow部署为网页应用，需要进行一系列修改和适配。

## 第一步：修改应用代码

在将应用部署到网络之前，需要创建一个纯Web版本的应用：

1. 创建一个新的`web`目录，作为Web版本的根目录
2. 复制`public`和`src`目录到`web`目录中
3. 修改主要JavaScript文件，移除所有Electron相关代码：

```javascript
// 创建一个新的web-renderer.js替代原有的renderer.js
// 移除所有IPC通信代码
// 使用浏览器localStorage代替electron-store
// 示例代码：
function saveSettings(settings) {
  localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
}

function getSettings() {
  const settings = localStorage.getItem('pomodoro-settings');
  return settings ? JSON.parse(settings) : {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4
  };
}
```

4. 创建一个新的`index.html`作为Web版本的入口点。下面是一个完整的示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="theme-color" content="#4a6cd1">
  <meta name="description" content="StudyFlow - 学习工具应用，提供专注计时、复习提醒、学习方法库等功能">
  <title>StudyFlow - 学习本应愉快</title>
  
  <!-- CSS 文件 -->
  <link rel="stylesheet" href="styles/main.css">
  <link rel="stylesheet" href="styles/mobile.css">
  <link rel="stylesheet" href="styles/pomodoro.css">
  <link rel="stylesheet" href="styles/modern.css">
  
  <!-- PWA 配置 -->
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="icons/favicon-32x32.png">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="152x152" href="icons/icon-152x152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="icons/icon-180x180.png">
  <link rel="apple-touch-icon" sizes="192x192" href="icons/icon-192x192.png">
</head>
<body>
  <!-- 应用内容 -->
  <div class="app-container">
    <!-- 头部导航 -->
    <header class="app-header">
      <!-- 应用标题和导航按钮 -->
    </header>

    <!-- 主要内容区域 -->
    <main class="app-content">
      <!-- 各页面内容 -->
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <!-- 版本信息和链接 -->
    </footer>
  </div>

  <!-- PWA注册 -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
          .then(registration => {
            console.log('Service Worker 注册成功:', registration);
          })
          .catch(error => {
            console.log('Service Worker 注册失败:', error);
          });
      });
    }
  </script>

  <!-- Web版渲染器脚本 -->
  <script src="web-renderer.js"></script>
</body>
</html>
```

5. 确保所有资源路径正确（CSS、图片等），使用相对路径

## 第二步：配置PWA功能

要将应用配置为完整的PWA（渐进式Web应用），需要创建以下文件：

### 1. 创建 manifest.json

在Web目录根目录下创建`manifest.json`文件，包含以下内容：

```json
{
  "name": "StudyFlow",
  "short_name": "StudyFlow",
  "description": "高效学习工具应用 - 番茄钟、复习提醒和学习方法集成",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4a6cd1",
  "orientation": "any",
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity"],
  "lang": "zh-CN"
}
```

### 2. 创建 service-worker.js

在Web目录根目录下创建`service-worker.js`文件，实现缓存和离线功能：

```javascript
// StudyFlow Service Worker
const CACHE_NAME = 'studyflow-cache-v1';
const OFFLINE_PAGE = '/index.html';

// 要缓存的资源
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/mobile.css',
  '/styles/pomodoro.css',
  '/styles/modern.css',
  '/web-renderer.js',
  '/manifest.json',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/mobile-guide.html',
  '/share-guide.html'
];

// 安装服务工作器
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 激活服务工作器
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存：', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 排除不需要缓存的请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在缓存中找到匹配项，返回缓存
        if (response) {
          return response;
        }

        // 否则去网络请求资源
        return fetch(event.request)
          .then((response) => {
            // 检查是否收到有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应，因为响应是流，只能使用一次
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 如果网络请求失败，返回离线页面
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_PAGE);
            }
          });
      })
  );
});

// 后台同步功能（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 数据同步函数（示例）
async function syncData() {
  console.log('数据同步已触发');
  // 实现您的数据同步逻辑
}

console.log('StudyFlow Service Worker 已加载');
```

### 3. 准备图标

PWA需要多种尺寸的图标，推荐创建以下尺寸：
- 192x192 像素（基本要求）
- 512x512 像素（基本要求）
- 152x152 像素（iPad触摸图标）
- 180x180 像素（iPhone触摸图标）
- 32x32 像素（favicon）

## 第三步：移动端适配

为确保应用在移动设备上有良好的体验，需要编写移动端样式：

### 1. 创建 mobile.css

```css
/* 移动端样式 - mobile.css */

/* 基本响应式设置 */
@media (max-width: 768px) {
  .app-container {
    padding: 0;
  }
  
  .app-header {
    padding: 10px;
    flex-direction: column;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }
  
  .main-nav {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    display: none; /* 默认隐藏，通过JavaScript控制显示 */
  }
  
  .main-nav.show-mobile-menu {
    display: flex;
  }
  
  .nav-btn {
    margin: 5px;
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  /* 移动菜单按钮 */
  #mobile-menu-toggle {
    display: block;
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    cursor: pointer;
    z-index: 100;
  }
  
  .menu-icon {
    display: block;
    position: relative;
    width: 30px;
    height: 3px;
    background-color: #333;
    margin: 0 auto;
  }
  
  .menu-icon::before,
  .menu-icon::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 3px;
    background-color: #333;
    left: 0;
  }
  
  .menu-icon::before {
    top: -8px;
  }
  
  .menu-icon::after {
    bottom: -8px;
  }
  
  /* 页面内容适配 */
  .app-content {
    padding: 10px;
  }
  
  .page {
    padding: 10px;
  }
  
  /* 专注计时器适配 */
  .timer-display {
    padding: 20px 10px;
  }
  
  .timer {
    font-size: 3rem;
  }
  
  /* 表单元素适配 */
  input, select, textarea {
    font-size: 16px; /* 防止iOS自动缩放 */
  }
  
  /* 触摸优化 */
  button, .action-btn, .nav-btn {
    min-height: 44px; /* 触摸目标最小尺寸 */
    min-width: 44px;
  }
  
  /* 表格滚动 */
  .table-container {
    overflow-x: auto;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .timer {
    font-size: 2.5rem;
  }
  
  .settings-section {
    padding: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    margin: 5px 0;
  }
}

/* 横屏模式 */
@media (max-width: 768px) and (orientation: landscape) {
  .app-header {
    flex-direction: row;
    align-items: center;
  }
  
  .app-header h1 {
    margin-bottom: 0;
    margin-right: 15px;
  }
}

/* 隐藏桌面端元素 */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
}

/* 仅在移动端显示的元素 */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
}
```

### 2. 触摸操作优化

在`web-renderer.js`中添加触摸操作支持：

```javascript
// 添加触摸滑动支持
function addTouchSupport() {
  let startX = 0;
  let startY = 0;
  
  // 首页滑动切换
  const pages = document.querySelectorAll('.page');
  const navButtons = document.querySelectorAll('.nav-btn');
  
  pages.forEach(page => {
    page.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    page.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      // 确保是水平滑动而不是垂直滚动
      if (Math.abs(endY - startY) < 50) {
        const diffX = endX - startX;
        
        if (Math.abs(diffX) > 100) {
          // 找到当前页面和当前激活的导航按钮
          const currentPage = document.querySelector('.page.active');
          const currentIndex = Array.from(pages).indexOf(currentPage);
          
          if (diffX > 0 && currentIndex > 0) {
            // 向右滑动，前往上一页
            const prevPageId = pages[currentIndex - 1].id.replace('-page', '');
            navigateToPage(prevPageId);
          } else if (diffX < 0 && currentIndex < pages.length - 1) {
            // 向左滑动，前往下一页
            const nextPageId = pages[currentIndex + 1].id.replace('-page', '');
            navigateToPage(nextPageId);
          }
        }
      }
    });
  });
}

// 初始化时调用
document.addEventListener('DOMContentLoaded', () => {
  // 其他初始化代码...
  
  // 添加触摸支持
  addTouchSupport();
});
```

## 第四步：配置GitHub Pages

1. 创建或使用已有的GitHub仓库
2. 将修改后的Web版本代码上传到仓库中
3. 在仓库设置中启用GitHub Pages：
   - 转到仓库设置 -> Pages
   - 在"Source"下选择部署源（main分支或特定目录）
   - 点击"Save"保存设置

4. 设置自定义域名（如果有）：
   - 在GitHub Pages设置中输入您的域名
   - 保存设置
   - GitHub会自动生成一个`CNAME`文件
   - 确保在DNS设置中添加了正确的记录（通常是CNAME记录）

## 第五步：配置Cloudflare Pages

如果您选择使用Cloudflare Pages部署：

1. 登录Cloudflare账户并转到Pages
2. 点击"Create a project"创建新项目
3. 连接到您的GitHub仓库
4. 配置构建设置：
   - 构建命令：如果是纯静态网站，可以留空
   - 构建输出目录：填写包含Web版本的目录（如果在根目录，填写`/`）
   - 环境变量：通常不需要设置

5. 点击"Save and Deploy"开始部署

## 第六步：DNS设置

如果使用自定义域名：

1. 在Cloudflare DNS设置中添加A记录或CNAME记录：
   - 类型：CNAME
   - 名称：www（或@用于根域名）
   - 目标：您的GitHub Pages URL或Cloudflare Pages URL
   - 代理状态：已代理（推荐）

2. 等待DNS传播（通常需要几分钟到几小时）

## 第七步：验证SSL/TLS设置

在Cloudflare SSL/TLS部分：

1. 确保SSL/TLS加密模式设置为"Full"或"Flexible"
2. 如果网站仍然无法访问，可能需要检查SSL/TLS证书是否正确配置

## 测试清单

部署后，请使用以下清单测试应用：

1. **基本功能测试**：
   - 所有页面是否正常加载
   - 页面切换是否流畅
   - 表单和交互元素是否可用
   - 数据是否正确保存到localStorage

2. **移动端兼容性测试**：
   - 在不同尺寸的手机和平板上测试
   - 测试横屏和竖屏模式
   - 测试触摸操作是否响应

3. **PWA功能测试**：
   - 验证"添加到主屏幕"功能
   - 测试离线使用能力
   - 检查应用启动速度

4. **浏览器兼容性测试**：
   - 在Chrome、Firefox、Safari和Edge上测试
   - 测试较旧版本的浏览器

## 常见问题排查

1. **网站打不开或显示错误**：
   - 检查DNS记录是否正确设置
   - 验证Cloudflare Pages部署是否成功
   - 查看Cloudflare Pages的构建日志
   - 检查浏览器控制台是否有JavaScript错误

2. **资源加载失败**：
   - 检查HTML中的资源路径是否正确
   - 确认所有JS/CSS文件都已上传
   - 检查控制台错误信息
   - 验证资源的MIME类型是否正确设置

3. **功能不正常**：
   - Web版本无法使用依赖Electron的功能（如文件系统访问）
   - 确保已替换所有Node.js相关代码
   - 验证localStorage存储是否正常工作

4. **样式问题**：
   - 检查CSS文件是否正确加载
   - 验证移动端适配是否生效
   - 使用浏览器开发者工具检查样式冲突

5. **PWA安装问题**：
   - 确保manifest.json正确配置
   - 验证service-worker.js是否正确注册
   - 检查PWA图标是否完整

## 后续步骤

成功部署Web版本后，建议：

1. 编写清晰的使用文档，说明Web版本与桌面版本的功能差异
2. 在网站首页添加桌面版本的下载链接
3. 定期更新Web版本，保持与桌面版本同步
4. 实现数据同步功能，允许用户在不同设备间同步数据
5. 添加用户账户系统，提供更好的数据备份和同步选项

---

如需进一步技术支持，请联系：
- 邮箱：studyflow-z@outlook.com
- 微信：AMD_0099 