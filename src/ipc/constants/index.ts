export const MAIN_ID = -1;
// 主进程：接收注册的渲染进程
export const ENOW_IPC_ON_REGISTER_RENDERER = 'enow_ipc:on_register_renderer';
// 渲染进程：接收与主进程建立连接的端口
export const ENOW_IPC_ON_RECEIVE_MAIN_PORT = 'enow_ipc:on_receive_main_port';
// 渲染进程：接收主进程发送过来的，当前渲染进程的ID
export const ENOW_IPC_ON_RECEIVE_RENDERER_ID = 'enow_ipc:on_receive_renderer_id';
// 已存在的渲染进程：接收与其他渲染进程建立连接的端口
export const ENOW_IPC_ON_RECEIVE_RENDERER_PORT = 'enow_ipc:on_receive_renderer_port';
// 新注册的渲染进程：接收与其他渲染进程建立连接后的端口列表
export const ENOW_IPC_ON_RECEIVE_OTHER_PORT_LIST = 'enow_ipc:on_receive_other_port_list';
// 渲染进程：主进程发送已断开连接的渲染进程的ID，用于解除维护已断开的渲染进程
export const ENOW_IPC_ON_REMOVE_CLIENT_PORT = 'enow_ipc:on_remove_client_port';

export const DEFAULT_IPC_TIMEOUT = 15000;
export const IPC_REQUEST = 'enow_ipc:ipc_request';
export const ENV_MAIN = 'enow_ipc:env_main';
export const ENV_CLIENT = 'enow_ipc:env_client';

export const DEFAULT_MAIN_ID = -1;  // 主进程ID