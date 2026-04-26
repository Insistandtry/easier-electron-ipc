# Easier Electron IPC

[English](README.md) | **中文**

使Electron IPC通信更加简单的TypeScript库。

### 支持通信场景

- 主进程内
- 主进程与渲染进程
- 渲染进程之间
- 渲染进程内

### 简洁的 API

- send & on
- request & response

### API 方法说明

| 方法                                         | 类型     | 描述                                           | 使用场景                   |
| -------------------------------------------- | -------- | ---------------------------------------------- | -------------------------- |
| `send(channel, data, options: ISendOptions)` | 发送     | 发送消息到指定频道                             | 单向通信，不需要返回值     |
| `on(channel, callback)`                      | 监听     | 监听指定频道的消息                             | 接收来自其他进程的消息     |
| `request(channel, data, options)`            | 请求     | 发送请求并等待响应                             | 双向通信，需要返回值       |
| `response(channel, callback)`                | 响应     | 响应来自指定频道的请求，默认超时时间是 15000ms | 处理请求并返回结果         |
| `once(channel, callback, options)`           | 发送     | 单次监听指定频道的消息                         | 单次单向通信，不需要返回值 |
| `off(channel, callback)`                     | 取消监听 | 取消对指定频道的监听                           | 清理事件监听器             |

### 类型

```typescript
export interface ISendOptions {
  /** 定向通信的目标窗口 ID，定义主窗口是 -1 */
  targetIds?: number[];
  mode?: ESendMode;
}

/**
 * 发送模式：
 * IPC：默认，进程间通信，主进程与渲染进程、渲染进程之间
 * Event：仅事件模式，同渲染进程内的事件分发
 * Both：同时支持 ipc 与事件模式
 * OnlyMain：进程间通信，仅发送到主进程，当 OnlyMain 时，则不再使用 targetIds
 * OnlyClient：进程间通信，仅发送到渲染进程
 */
export enum ESendMode {
  IPC = 'IPC',
  Event = 'Event',
  Both = 'Both',
  OnlyMain = 'OnlyMain',
  OnlyClient = 'OnlyClient',
}
```

## 安装

```bash
npm install easier-electron-ipc
```

## 使用

```typescript
// 主进程 在主进程代码入口初始化即可
import { IPCMain } from 'easier-electron-ipc';
global.ipcMain = new IPCMain();

global.ipcMain.on('CLOSE_SETTING', (data, options) => {
  // ...
})
global.ipcMain.response('GET_SYSTEM_INFO', (data, options) => {
  return 'ok';
});

// preload 中初始化
import { IPCClient } from 'easier-electron-ipc';
const ipcClient = new IPCClient();

window.electron = {
  ipc: ipcClient,
  api: {
    system: {
      closeSetting: (,data, options) => ipcClient.send('CLOSE_SETTING', data, options)
      getSystemInfo: (data, options) =>
        ipcClient.request('GET_SYSTEM_INFO', data, options),
    },
  },
};

// renderer 中使用

window.electron.api.system.closeSetting({ time: Date.now() }, { mode: 'OnlyMain' })

window.electron.api.system.getSystemInfo(
  { time: Date.now() },
  { timeout: 5000 }
);

```

### 其他使用场景

#### 相同的 channel，流式操作：先触发主进程，再触发其他渲染进程（多标签的关闭存在此场景）

```typescript
// A 渲染进程监听 channelA
window.electron.ipc.on('channelA', () => {});
// 主进程监听 channelA
global.enow.ipcMain.on('channelA', () => {});

// 发送：
// 渲染进程 B
window.electron.ipc.send('channelA', data, { mode: 'OnlyMain' }); // 主进程响应
window.electron.ipc.send('channelA', data, { mode: 'OnlyRender' }); // 包括 A 渲染进程在内的其他渲染响应
```

#### 同渲染进程中使用 send-on，当事件使用

```typescript
// A 渲染进程中
window.electron.ipc.on('channelA', () => {});

// 某个时刻调用
window.electron.ipc.send('channelA', data); // A 渲染进程(自己)不会响应
window.electron.ipc.send('channelA', data, { mode: 'Event' }); // 当第三个参数中 mode 设置为 Event、Both时，A 渲染进程(自己)会响应
```
