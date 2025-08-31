# Easier Electron IPC

[中文](README.md) | **English**

A TypeScript library that makes Electron IPC communication easier.

### Supported Communication Scenarios

- Within main process
- Between main process and renderer process
- Between renderer processes
- Within renderer process

### Simple APIs

- send & on
- request & response

### API Methods Description

| Method                                       | Type     | Description                                                            | Use Case                                        |
| -------------------------------------------- | -------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| `send(channel, data, options: ISendOptions)` | Send     | Send message to specified channel                                      | One-way communication, no return value          |
| `on(channel, callback)`                      | Listen   | Listen to messages on specified channel                                | Receive messages from other processes           |
| `request(channel, data, options)`            | Request  | Send request and wait for response                                     | Two-way communication, needs return value       |
| `response(channel, callback)`                | Response | Respond to requests from specified channel, default timeout is 15000ms | Handle requests and return results              |
| `once(channel, callback, options)`           | Send     | Listen to specified channel message once                               | One-time one-way communication, no return value |
| `off(channel, callback)`                     | Unlisten | Cancel listening to specified channel                                  | Clean up event listeners                        |

### Types

```typescript
export interface ISendOptions {
  /** Target window IDs for directed communication, main window is -1 */
  targetIds?: number[];
  mode?: ESendMode;
}

/**
 * Send modes:
 * IPC: Default, inter-process communication between main and renderer processes
 * Event: Event mode only, event distribution within same renderer process
 * Both: Support both IPC and event mode
 * OnlyMain: Inter-process communication, send to main process only, targetIds ignored when OnlyMain
 * OnlyClient: Inter-process communication, send to renderer process only
 */
export enum ESendMode {
  IPC = 'IPC',
  Event = 'Event',
  Both = 'Both',
  OnlyMain = 'OnlyMain',
  OnlyClient = 'OnlyClient',
}
```

## Installation

```bash
npm install easier-electron-ipc
```

## Usage

```typescript
// Main process - Initialize at the entry point of main process code
import { IPCMain } from 'easier-electron-ipc';
global.ipcMain = new IPCMain();

global.ipcMain.on('CLOSE_SETTING', (data, options) => {
  // ...
})
global.ipcMain.response('GET_SYSTEM_INFO', (data, options) => {
  return 'ok';
});

// Initialize in preload
import { IPCClient } from 'easier-electron-ipc';
const ipcClient = new IPCClient();

window.electron = {
  ipc: ipcClient,
  api: {
    system: {
      closeSetting: (data, options) => ipcClient.send('CLOSE_SETTING', data, options)
      getSystemInfo: (data, options) =>
        ipcClient.request('GET_SYSTEM_INFO', data, options),
    },
  },
};

// Use in renderer

window.electron.api.system.closeSetting({ time: Date.now() }, { mode: 'OnlyMain' })

window.electron.api.system.getSystemInfo(
  { time: Date.now() },
  { timeout: 5000 }
);

```

### Other Use Cases

#### Same channel, streaming operations: trigger main process first, then other renderer processes (this scenario exists when closing multiple tabs)

```typescript
// Renderer process A listens to channelA
window.electron.ipc.on('channelA', () => {});
// Main process listens to channelA
global.enow.ipcMain.on('channelA', () => {});

// Send:
// Renderer process B
window.electron.ipc.send('channelA', data, { mode: 'OnlyMain' }); // Main process responds
window.electron.ipc.send('channelA', data, { mode: 'OnlyRender' }); // Other renderers including A respond
```

#### Using send-on within same renderer process as events

```typescript
// In renderer process A
window.electron.ipc.on('channelA', () => {});

// Called at some point
window.electron.ipc.send('channelA', data); // Renderer process A (itself) won't respond
window.electron.ipc.send('channelA', data, { mode: 'Event' }); // When mode is set to Event or Both in third parameter, renderer process A (itself) will respond
```
