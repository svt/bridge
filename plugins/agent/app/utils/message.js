export function messageFactory (msg) {
  return {
    type: 'user',
    ...msg
  }
}
