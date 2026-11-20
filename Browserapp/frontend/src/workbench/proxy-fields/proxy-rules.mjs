const colonForm = /^(?:(?<protocol>https?|ssh|socks5):\/\/)?(?<host>\[[^\]]+\]|[^:[\]{}@]+):(?<port>\d+)(?::(?<user>[^:[\]{}]*))?(?::(?<pass>[^:[\]{}]*))?(?:\[(?<refresh>[^\]]*)\])?(?:\{(?<remark>[^}]*)\})?$/;
const userForm = /^(?:(?<protocol>https?|ssh|socks5):\/\/)?(?:(?<user>[^:@[\]{}]+):(?<pass>[^:@[\]{}]+)@(?<host>\[[^\]]+\]|[^:[\]{}@]+):(?<port>\d+)|(?<protocol2>https?|ssh|socks5):\/\/(?<host2>\[[^\]]+\]|[^:[\]{}@]+):(?<port2>\d+):(?<user2>[^:[\]{}]+):(?<pass2>[^:[\]{}]+))(?:\[(?<refresh>[^\]]*)\])?(?:\{(?<remark>[^}]*)\})?$/;
const hasUserPrefix = /^(?:(?:https?|ssh|socks5):\/\/)?[^:/\s]+:[^:/\s]+@/;
function parseProxyRules(text) {
  const match = String(text ?? '').match(hasUserPrefix.test(text) ? userForm : colonForm)?.groups;
  return { protocol: match?.protocol, host: match?.host, port: match?.port, proxyUserName: match?.user,
    proxyPassword: match?.pass, refreshUrl: match?.refresh, remark: match?.remark };
}

async function unavailableEncryptedProxy() {
  throw Error($t('无法读取旧客户端加密的代理 IP'));
}
export { parseProxyRules as Tr, unavailableEncryptedProxy as tr };
