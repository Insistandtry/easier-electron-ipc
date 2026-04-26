// 渲染进程代码

// 使用类型断言
const electron = (window as any).electron;

// 监听来自主进程的消息
electron.ipc.on('message-from-main', (data: any, options: any) => {
  console.log('渲染进程收到主进程消息:', data);
  console.log('消息来源:', options?.fromId);
  
  // 显示消息
  displayMessage('来自主进程', data);
});

// 监听来自其他渲染进程的消息
electron.ipc.on('message-from-other-renderer', (data: any, options: any) => {
  console.log('渲染进程收到其他渲染进程消息:', data);
  console.log('消息来源:', options?.fromId);
  
  // 显示消息
  displayMessage('来自其他渲染进程', data);
});

// 发送消息到主进程
function sendMessageToMain() {
  const message = document.getElementById('message-input') as HTMLInputElement;
  const data = {
    message: message.value,
    timestamp: Date.now(),
    sender: 'renderer'
  };
  electron.ipc.send('message-from-renderer', data, { mode: 'OnlyMain' });
  console.log('发送消息到主进程:', data);
  
  // 显示发送的消息
  displayMessage('发送到主进程', data);
  
  // 清空输入框
  message.value = '';
}

// 发送消息到其他渲染进程
function sendMessageToOtherRenderers() {
  const message = document.getElementById('message-input') as HTMLInputElement;
  const data = {
    message: message.value,
    timestamp: Date.now(),
    sender: 'renderer'
  };
  
  electron.ipc.send('message-from-other-renderer', data, { mode: 'OnlyClient' });
  console.log('发送消息到其他渲染进程:', data);
  
  // 显示发送的消息
  displayMessage('发送到其他渲染进程', data);
  
  // 清空输入框
  message.value = '';
}

// 发送请求到主进程
async function sendRequestToMain() {
  const message = document.getElementById('message-input') as HTMLInputElement;
  const data = {
    message: message.value,
    timestamp: Date.now(),
    sender: 'renderer'
  };
  
  try {
    const response = await electron.ipc.request('get-system-info', data);
    console.log('收到主进程响应:', response);
    
    // 显示响应
    displayMessage('主进程响应', response);
  } catch (error: any) {
    console.error('请求失败:', error);
    displayMessage('请求失败', { error: error.message });
  }
  
  // 清空输入框
  message.value = '';
}

// 显示消息到界面
function displayMessage(title: string, data: any) {
  const messagesDiv = document.getElementById('messages') as HTMLDivElement;
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  
  const dataElement = document.createElement('pre');
  dataElement.textContent = JSON.stringify(data, null, 2);
  
  messageDiv.appendChild(titleElement);
  messageDiv.appendChild(dataElement);
  messagesDiv.appendChild(messageDiv);
  
  // 滚动到底部
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 绑定按钮事件
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded ', document.getElementById('send-to-main'))
  document.getElementById('send-to-main')?.addEventListener('click', sendMessageToMain);
  document.getElementById('send-to-other')?.addEventListener('click', sendMessageToOtherRenderers);
  document.getElementById('send-request')?.addEventListener('click', sendRequestToMain);
  
  // 初始显示
  displayMessage('系统信息', {
    message: '渲染进程已初始化',
    timestamp: Date.now()
  });
});
