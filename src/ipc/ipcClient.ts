import { ipcRenderer } from 'electron';
import {
  ENOW_IPC_ON_RECEIVE_MAIN_PORT,
  ENOW_IPC_ON_RECEIVE_OTHER_PORT_LIST,
  ENOW_IPC_ON_RECEIVE_RENDERER_ID,
  ENOW_IPC_ON_RECEIVE_RENDERER_PORT,
  ENOW_IPC_ON_REGISTER_RENDERER,
  ENOW_IPC_ON_REMOVE_CLIENT_PORT,
  ENV_CLIENT,
  MAIN_ID,
} from './constants';
import { IIPCClient, IIPCMessage, IRequestOptions } from '../types/ipc';
import { timeoutWrapper } from './utils/timeout';
import { DEFAULT_IPC_TIMEOUT } from './constants';
import IPCBase from './ipcBase';

export default class IPCClient extends IPCBase implements IIPCClient {
  env = ENV_CLIENT;

  constructor() {
    console.log('[实例化] IPCClient ！！！');
    super();
    this.init();
  }

  /**
   * 请求响应场景目前只考虑渲染进程-主进程
   */
  public request = (channel: string, data = {}, options = {} as IRequestOptions) => {
    const timeout = options.timeout || DEFAULT_IPC_TIMEOUT;
    const requestPromise = timeoutWrapper(this._request(channel, data), { timeout });
    return requestPromise.then((result) => {
      return result;
    });
  };

  private _request = (channel: string, data) => {
    return ipcRenderer.invoke(channel, data);
  };

  init = () => {
    ipcRenderer.send(ENOW_IPC_ON_REGISTER_RENDERER);
    this._registerListeners();
  };

  private _processMessage = (message: IIPCMessage) => {
    this.handleMessage(message, {
      fromId: message?.fromId,
    });
  };

  /** 处理端口 */
  private _processClientPort = (webContentId: number, port: MessagePort) => {
    this.clientPortMap.set(webContentId, port);
    // 使用 onmessage 事件时已隐含调用 port.start()
    port.onmessage = (event) => {
      console.log('IPCClient onmessage!!!!', webContentId, event.data);
      this._processMessage(event.data);
    };
  };

  private _registerListeners = () => {
    ipcRenderer.on(ENOW_IPC_ON_RECEIVE_MAIN_PORT, (event) => {
      this._processClientPort(MAIN_ID, event.ports[0]);
    });

    ipcRenderer.on(ENOW_IPC_ON_RECEIVE_RENDERER_ID, (event, args) => {
      const { webContentId } = args;
      this.currentId = webContentId;
      console.log('当前渲染进程的ID是', webContentId);
    });

    ipcRenderer.on(ENOW_IPC_ON_RECEIVE_RENDERER_PORT, (event, args) => {
      const { webContentsId } = args;
      this._processClientPort(webContentsId, event.ports[0]);
    });

    ipcRenderer.on(ENOW_IPC_ON_RECEIVE_OTHER_PORT_LIST, (event, args) => {
      console.log('[render] enow_ipc:receive_other_port args ==>', args);
      const { webContentsIds } = args;
      webContentsIds.forEach((id: number, index: number) => {
        this._processClientPort(id, event.ports[index]);
      });
    });

    ipcRenderer.on(ENOW_IPC_ON_REMOVE_CLIENT_PORT, (event, args) => {
      const { webContentId } = args;
      console.log(`接收到已断开连接的渲染进程，ID=>${webContentId}`);
      this.removeClientPort(webContentId);
    });
  };
}
