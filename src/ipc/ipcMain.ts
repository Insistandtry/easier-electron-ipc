import { MessageChannelMain, ipcMain, webContents } from 'electron';
import IPCBase from './ipcBase';
import {
  ENOW_IPC_ON_RECEIVE_MAIN_PORT,
  ENOW_IPC_ON_RECEIVE_OTHER_PORT_LIST,
  ENOW_IPC_ON_RECEIVE_RENDERER_ID,
  ENOW_IPC_ON_RECEIVE_RENDERER_PORT,
  ENOW_IPC_ON_REGISTER_RENDERER,
  ENOW_IPC_ON_REMOVE_CLIENT_PORT,
  ENV_MAIN,
  DEFAULT_MAIN_ID,
} from './constants';
import { IIPCListener, IIPCMain } from '../types/ipc';

export default class IPCMain extends IPCBase implements IIPCMain {
  env = ENV_MAIN;
  currentId = DEFAULT_MAIN_ID;
  requestCallbackPool: Map<string, IIPCListener> = new Map();

  constructor() {
    console.log('[实例化] IPCMain ！！！');
    super();
    this.init();
  }

  init = () => {
    this._registerListeners();
  };

  public response = (channel: string, listener: IIPCListener) => {
    ipcMain.handle(channel, (event, ...args) => {
      return listener.apply(this, args);
    });
  };

  private _registerListeners = () => {
    ipcMain.on(ENOW_IPC_ON_REGISTER_RENDERER, (event) => {
      if (this.clientPortMap[event.sender.id]) {
        console.log('渲染进程已注册');
        return;
      }
      console.log(`[创建渲染进程] senderId=${event.sender.id}; 渲染进程url=${event.sender.getURL()}`);
      event.sender.send(ENOW_IPC_ON_RECEIVE_RENDERER_ID, { webContentId: event.sender.id });
      this._establishClientConnection(event.sender);
      this._establishMainConnection(event.sender);
    });
  };

  /**
   * 新注册的渲染进程与已存在的渲染进程建立连接，各自分发端口
   * 1、把新渲染进程端口分发给已存在渲染进程
   * 2、把已存在渲染进程的所有端口集合，分发给新渲染进程
   */
  private _establishClientConnection = (sender: Electron.WebContents) => {
    const newKey = sender.id;
    const webContentsIds: number[] = [];
    const otherPortList: any[] = [];
    // 1、遍历目前存在的渲染进程，将新的渲染进程与已有渲染进程建立新的通信连接
    for (const [otherKey] of this.clientPortMap) {
      const { port1, port2 } = new MessageChannelMain();
      webContentsIds.push(otherKey);
      otherPortList.push(port2);
      // 2、把新渲染进程端口分发给已存在渲染进程
      webContents
        .fromId(otherKey)
        ?.postMessage?.(ENOW_IPC_ON_RECEIVE_RENDERER_PORT, { webContentsId: newKey }, [port1]);
    }
    // 3、把已存在渲染进程的所有端口集合，分发给新渲染进程
    sender.postMessage(ENOW_IPC_ON_RECEIVE_OTHER_PORT_LIST, { webContentsIds }, otherPortList);
  };

  /**
   * 新注册渲染进程与主进程建立连接，分发端口
   */
  private _establishMainConnection = (sender: Electron.WebContents) => {
    const key = sender.id;
    const { port1, port2 } = new MessageChannelMain();
    // 2、将主进程的端口 port1 分发给新注册渲染进程
    sender.postMessage(ENOW_IPC_ON_RECEIVE_MAIN_PORT, null, [port1]);
    // 3、将另外端口 port2 维护到 clientPortMap
    this.clientPortMap.set(key, port2);
    // 主进程监听消息
    port2.on('message', (event) => {
      console.log('主进程接收来自渲染进程的消息：', event.data);
      this.handleMessage(event.data, {
        fromId: event.data.fromId,
      });
    });
    port2.on('close', () => {
      this._processCloseConnection(key);
    });
    port2.start();
  };

  private _processCloseConnection = (disConnectedId: number) => {
    this.removeClientPort(disConnectedId);
    for (const [key] of this.clientPortMap) {
      if (key === disConnectedId) {
        continue;
      }
      webContents.fromId(key)?.send(ENOW_IPC_ON_REMOVE_CLIENT_PORT, { webContentId: disConnectedId });
    }
  };
}
