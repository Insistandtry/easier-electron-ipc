import { MessagePortMain } from 'electron';

type Unsubscribe = () => void;

export interface IListenerOptions {
  fromId?: number;
}

export type IClientPortMap = Map<number, MessagePortMain | MessagePort>;
export type IIPCListener = (data: any, options?: IListenerOptions) => void;

// ipc 消息： event.data 传递的数据
export interface IIPCMessage extends Partial<IListenerOptions> {
  channel: string;
  data: any;
}

export interface ICallback {
  listener: IIPCListener; // 回调函数
  once?: boolean; // 是否单次执行
}

export interface IRequestOptions {
  timeout?: number;
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

export type ISendMode = keyof typeof ESendMode;

export interface ISendOptions {
  /** 定向通信的目标窗口 ID，定义主窗口是 -1 */
  targetIds?: number[];
  /**
   * 发送模式：
   * IPC：默认，进程间通信，主进程与渲染进程、渲染进程之间
   * Event：仅事件模式，同渲染进程内的事件分发
   * Both：同时支持 ipc 与事件模式
   * OnlyMain：进程间通信，仅发送到主进程，当 OnlyMain 时，则不再使用 targetIds
   * OnlyClient：进程间通信，仅发送到渲染进程
   */
  mode?: ISendMode;
}

export interface IIPCBase {
  currentId: number; // 记录当前进程的ID，主进程默认-1，渲染进程为 webContentId
  send: (channel: string, data?, options?: ISendOptions) => void;
  on: (channel: string, listener: IIPCListener) => Unsubscribe;
  once: (channel: string, listener: IIPCListener) => Unsubscribe;
  off: (channel: string, listener: IIPCListener) => void;
}

export interface IIPCMain extends IIPCBase {
  response: (channel: string, listener: IIPCListener) => void;
}

export interface IIPCClient extends IIPCBase {
  request: (channel: string, data?, options?: IRequestOptions) => Promise<any>;
}
