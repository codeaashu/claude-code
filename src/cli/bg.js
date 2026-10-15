// Minimal shim for background session handlers when full implementation is omitted.
export async function psHandler(args = []) {
  throw new Error('Background session `ps` is not available in this build.');
}

export async function logsHandler(id) {
  throw new Error('Background session `logs` is not available in this build.');
}

export async function attachHandler(id) {
  throw new Error('Background session `attach` is not available in this build.');
}

export async function killHandler(id) {
  throw new Error('Background session `kill` is not available in this build.');
}

export async function handleBgFlag(args = []) {
  throw new Error('Background flag handling is not available in this build.');
}

export default { psHandler, logsHandler, attachHandler, killHandler, handleBgFlag };
