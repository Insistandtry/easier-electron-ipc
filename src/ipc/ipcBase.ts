import {
  IClientPortMap,
  IIPCBase,
  ICallback,
  IIPCListener,
  IIPCMessage,
  ISendOptions,
  ESendMode,
  IListenerOptions,
} from '../types/ipc';
import { EventEmitter } from 'events';
import { DEFAULT_MAIN_ID } from './constants';

export default class IPCBase implements IIPCBase {
  clientPortMap: IClientPortMap = new Map() as IClientPortMap;
  currentId: number;
  private event = new EventEmitter();
  private channelCallbackPool: Map<string, ICallback[]> = new Map();

  public on = (channel: string, listener: IIPCListener, once = false) => {
    if (!this.channelCallbackPool.get(channel)) {
      this.channelCallbackPool.set(channel, []);
    }
    this.channelCallbackPool.get(channel)?.push?.({ listener, once });
    const onEventFunc = once ? this.event.once : this.event.on;
    onEventFunc.call(this.event, channel, listener);

    return () => this.off(channel, listener);
  };

  public once = (channel: string, listener: IIPCListener) => {
    return this.on(channel, listener, true);
  };

  public off = (channel: string, listener?: IIPCListener) => {
    if (!channel || !this.channelCallbackPool.get(channel)) {
      console.log(`[channel off] ${channel} 未注册!`);
      return;
    }
    if (typeof listener === 'function') {
      this.channelCallbackPool.set(
        channel,
        this.channelCallbackPool.get(channel)?.filter((item) => item.listener !== listener) || [],
      );
      this.event.off(channel, listener);
    } else {
      this.channelCallbackPool.delete(channel);
      this.event.removeAllListeners(channel);
    }
  };

  public removeClientPort = (webContentId: number) => {
    this.clientPortMap.get(webContentId)?.close();
    this.clientPortMap.delete(webContentId);
  };

  /**
   * 发送消息到订阅了 channel 的主进程、渲染进程
   * @param channel 发送方的 channel
   * @param data 发送的数据
   * @param options
   *  1）参数 targetIds 定向发送到对应渲染进程id，主进程的id 固定为 -1
   *  2）参数 mode 发送模式：
   *    IPC - 默认模式，进程间通信
   *    Event - 仅事件模式，用于同渲染进程通信
   *    Both - ipc+事件
   *    OnlyMain - 仅发送到主进程
   *    OnlyClient - 仅发送到渲染进程
   */
  public send = (channel: string, data?, options?: ISendOptions) => {
    const isEventEmit = options?.mode === ESendMode.Event || options?.mode === ESendMode.Both;
    this.sendToClient(channel, data, options);
    isEventEmit && this.event.emit(channel, data);
  };

  /**
   * 通过端口发送消息
   * @param options 发送配置，mode 优先级高于 targetIds，理论上取两者的交集
   * 1）mode 发送模式，当 OnlyMain 时，则不再使用 targetIds
   * 2）targetIds 定向发送到对应渲染进程id，主进程的id 固定为 -1
   */
  public sendToClient = (channel: string, data, options?: ISendOptions) => {
    const mode = options?.mode;
    // 指定发送到主进程
    if (mode === ESendMode.OnlyMain) {
      this.clientPortMap.get(DEFAULT_MAIN_ID)?.postMessage({ channel, data, fromId: this.currentId });
      return;
    }

    const targetIdSet = new Set(options?.targetIds);
    for (const [key, port] of this.clientPortMap) {
      // 设置 OnlyClient 表示跳过主进程
      if (mode === ESendMode.OnlyClient && key === DEFAULT_MAIN_ID) {
        continue;
      }
      // 存在 targetIds 时，不在 targetIds 中的端口不发送
      if (targetIdSet.size > 0 && !targetIdSet.has(key)) {
        continue;
      }
      // 记录发送源 ID，-1 表示主进程
      port.postMessage({ channel, data, fromId: this.currentId });
    }
  };

  /**
   * 接收到 channel 消息后进行处理
   */
  public handleMessage = (message: IIPCMessage, options?: IListenerOptions) => {
    const { channel } = message;
    const callbacks = this.channelCallbackPool.get(channel);
    if (!channel || !callbacks?.length) {
      return;
    }
    callbacks.forEach((callback) => {
      callback.listener(message.data, options);
      if (callback.once) {
        this.off(channel, callback.listener);
      }
    });
  };
}
