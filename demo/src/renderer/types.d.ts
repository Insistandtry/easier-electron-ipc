// 类型声明文件
declare global {
  interface Window {
    electron: {
      ipc: {
        send: (channel: string, data: any, options?: any) => void;
        on: (channel: string, listener: (data: any, options?: any) => void) => () => void;
        once: (channel: string, listener: (data: any, options?: any) => void) => () => void;
        off: (channel: string, listener: (data: any, options?: any) => void) => void;
        request: (channel: string, data: any, options?: any) => Promise<any>;
      };
    };
  }
}