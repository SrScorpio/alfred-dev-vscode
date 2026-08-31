const assert = require('node:assert/strict');
const test = require('node:test');

const { openAlfredChat } = require('../out/commands/chatCommand.js');

test('convierte el fallo de chat en un mensaje accionable', async () => {
  const messages = [];
  const executeCommand = async () => {
    throw new Error('command not found');
  };

  await openAlfredChat(executeCommand, (message) => messages.push(message));

  assert.deepEqual(messages, [
    'No se pudo abrir el chat de Alfred. Instala o activa GitHub Copilot Chat y vuelve a intentarlo.',
  ]);
});

test('abre el chat con el prompt fijo de Alfred', async () => {
  const calls = [];
  const executeCommand = async (...args) => {
    calls.push(args);
  };

  await openAlfredChat(executeCommand, () => {});

  assert.deepEqual(calls, [['workbench.action.chat.open', '@alfred']]);
});