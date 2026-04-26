import { contextBridge } from 'electron';
import { IPCClient } from 'easier-electron-ipc';

// 初始化 IPCClient
const ipcClient = new IPCClient();

console.log('[Preload] IPCClient created, clientPortMap size:', ipcClient.clientPortMap.size);

// 通过 contextBridge 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
  ipc: {
    // 发送消息
    send: (channel: string, data: any, options?: any) => {
      console.log('[Preload] send called:', channel, data, 'clientPortMap size:', ipcClient.clientPortMap.size);
      return ipcClient.send(channel, data, options);
    },
    // 监听消息
    on: (channel: string, listener: (data: any, options?: any) => void) => {
      console.log('[Preload] on registered for:', channel);
      return ipcClient.on(channel, listener);
    },
    // 单次监听
    once: (channel: string, listener: (data: any, options?: any) => void) => ipcClient.once(channel, listener),
    // 取消监听
    off: (channel: string, listener: (data: any, options?: any) => void) => ipcClient.off(channel, listener),
    // 发送请求
    request: (channel: string, data: any, options?: any) => ipcClient.request(channel, data, options)
  }
});

// 导出类型，方便渲染进程使用
export interface IIPC {
  send: (channel: string, data: any, options?: any) => void;
  on: (channel: string, listener: (data: any, options?: any) => void) => () => void;
  once: (channel: string, listener: (data: any, options?: any) => void) => () => void;
  off: (channel: string, listener: (data: any, options?: any) => void) => void;
  request: (channel: string, data: any, options?: any) => Promise<any>;
}

declare global {
  interface Window {
    electron: {
      ipc: IIPC;
    };
  }
}
