const addressType = { IPV4: 'IPV4', IPV6: 'IPV6' };
const checkStatus = { none: 0, success: 1, failure: 2, 0: 'none', 1: 'success', 2: 'failure' };
const proxyType = { SOCKS5: 'SOCKS5', HTTP: 'HTTP', HTTPS: 'HTTPS', SSH: 'SSH' };
const source = { resource: 0, buy: 1, 0: 'resource', 1: 'buy' };
const orderStatus = { pending: 0, done: 1, refunding: 2, changing: 3, refunded: 4,
  0: 'pending', 1: 'done', 2: 'refunding', 3: 'changing', 4: 'refunded' };
const renewalStatus = { expired: 0, using: 1, soon: 2, 0: 'expired', 1: 'using', 2: 'soon' };
const binding = { Unbound: 0, Bound: 1, 0: 'Unbound', 1: 'Bound' };
const enabled = { Disabled: 0, Enabled: 1, 0: 'Disabled', 1: 'Enabled' };
const proxyUse = { List: 'list_use', Available: 'available_list', Use: 'window_use', UseDeploy: 'window_use_deploy' };
const renewalMode = { Normal: 0, Immediate: 1, 0: 'Normal', 1: 'Immediate' };

export { binding as a, proxyType as d, enabled as i, orderStatus as l, source as m, proxyUse as n, checkStatus as o,
  addressType as r, renewalStatus as s, renewalMode as t };
