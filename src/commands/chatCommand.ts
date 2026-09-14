/**
 * Abre el chat de Alfred y convierte errores de disponibilidad en una ayuda
 * accionable para la persona usuaria.
 *
 * @module commands/chatCommand
 */
const CHAT_COMMAND = 'workbench.action.chat.open';
const CHAT_ERROR_MESSAGE = 'No se pudo abrir el chat de Alfred. Instala o activa GitHub Copilot Chat y vuelve a intentarlo.';

type ChatExecutor = (command: string, prompt: string) => PromiseLike<unknown>;
type ErrorMessage = (message: string) => unknown;

/**
 * Ejecuta la apertura del chat con un prompt fijo y gestiona fallos de VS Code.
 *
 * @param executeCommand Adaptador de `vscode.commands.executeCommand`.
 * @param showErrorMessage Adaptador de `vscode.window.showErrorMessage`.
 * @param prompt Prompt que se enviará al chat.
 */
export async function openAlfredChat(
  executeCommand: ChatExecutor,
  showErrorMessage: ErrorMessage,
  prompt = '@alfred',
): Promise<void> {
  try {
    await executeCommand(CHAT_COMMAND, prompt);
  } catch {
    showErrorMessage(CHAT_ERROR_MESSAGE);
  }
}