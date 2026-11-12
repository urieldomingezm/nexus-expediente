import * as NexusExpediente from './index'

declare global {
  interface Window {
    NexusExpediente: typeof NexusExpediente
  }
}
window.NexusExpediente = NexusExpediente
export default NexusExpediente
