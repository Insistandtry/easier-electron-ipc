import { app, BrowserWindow, screen } from 'electron';
import { IPCMain } from 'easier-electron-ipc';
import path from 'path';

// 初始化 IPCMain
const ipcMain = new IPCMain();

// 存储窗口实例
const windows: BrowserWindow[] = [];

// 创建窗口函数
function createWindow(index: number) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  const win = new BrowserWindow({
    width: width / 2,
    height: height / 2,
    x: (index % 2) * (width / 2),
    y: Math.floor(index / 2) * (height / 2),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  });

  // 加载渲染进程页面
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // 打开开发者工具
  win.webContents.openDevTools();
  
  // 窗口关闭时从数组中移除
  win.on('closed', () => {
    const idx = windows.indexOf(win);
    if (idx > -1) {
      windows.splice(idx, 1);
    }
  });
  
  windows.push(win);
  return win;
}

// 监听渲染进程发送的消息
ipcMain.on('message-from-renderer', (data, options) => {
  console.log('主进程收到消息:', data);
  console.log('消息来源:', options?.fromId);
  
  // 向所有渲染进程广播消息
  ipcMain.send('message-from-main', {
    message: 'Hello from main process!',
    receivedData: data,
    timestamp: Date.now()
  });
});

// 响应渲染进程的请求
ipcMain.response('get-system-info', (data, options) => {
  console.log('主进程收到请求:', data);
  console.log('请求来源:', options?.fromId);
  
  return {
    platform: process.platform,
    version: process.version,
    electron: process.versions.electron,
    timestamp: Date.now(),
    requestData: data
  };
});

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  // 创建两个窗口，用于测试渲染进程之间的通信
  createWindow(0);
  createWindow(1);
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(0);
    }
  });
});

// 应用关闭逻辑
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
