export function isTrustedSender(senderUrl: string, applicationUrl: string): boolean {
  try {
    const sender = new URL(senderUrl);
    const application = new URL(applicationUrl);

    return sender.origin === application.origin && sender.pathname === application.pathname;
  } catch {
    return false;
  }
}
