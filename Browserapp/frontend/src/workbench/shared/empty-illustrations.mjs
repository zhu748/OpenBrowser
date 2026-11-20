const illustrations = {
  "empty-account.png": { light: "/assets/empty-account-R6YZy9Pw.png", dark: "/assets/empty-account-CYtj4A1Y.png" },
  "empty-accounts.png": { light: "/assets/empty-accounts-Dss0WsG9.png", dark: "/assets/empty-accounts-ByAOxtgb.png" },
  "empty-cloud-phone-app.png": { light: "/assets/empty-cloud-phone-app-Dg5_KU7G.png", dark: "/assets/empty-cloud-phone-app-Dl5wkdXH.png" },
  "empty-cloud-phone.png": { light: "/assets/empty-cloud-phone-Btkj_54f.png", dark: "/assets/empty-cloud-phone-BPI8nlVp.png" },
  "empty-device.png": { light: "/assets/empty-device-BEWzvjhU.png", dark: "/assets/empty-device-BkLNQyky.png" },
  "empty-extensions.png": { light: "/assets/empty-extensions-DbjbH15A.png", dark: "/assets/empty-extensions-BtZyusJY.png" },
  "empty-profiles.png": { light: "/assets/empty-profiles-DZB3p5Zk.png", dark: "/assets/empty-profiles-DRB2hhw8.png" },
  "empty-proxies.png": { light: "/assets/empty-proxies-MpRDXMvJ.png", dark: "/assets/empty-proxies-DEsf9ilD.png" },
  "rx_illustration_bin.svg": { light: "/images/empty-illustrations/rx-illustration-bin-light.svg", dark: "/images/empty-illustrations/rx-illustration-bin-dark.svg" },
  "rx_illustration_coin.svg": { light: "/images/empty-illustrations/rx-illustration-coin-light.svg", dark: "/images/empty-illustrations/rx-illustration-coin-dark.svg" },
  "rx_illustration_compass.svg": { light: "/images/empty-illustrations/rx-illustration-compass-light.svg", dark: "/images/empty-illustrations/rx-illustration-compass-dark.svg" },
  "rx_illustration_extension.svg": { light: "/images/empty-illustrations/rx-illustration-extension-light.svg", dark: "/images/empty-illustrations/rx-illustration-extension-dark.svg" },
  "rx_illustration_filter.svg": { light: "/images/empty-illustrations/rx-illustration-filter-light.svg", dark: "/images/empty-illustrations/rx-illustration-filter-dark.svg" },
  "rx_illustration_lock.svg": { light: "/images/empty-illustrations/rx-illustration-lock-light.svg", dark: "/images/empty-illustrations/rx-illustration-lock-dark.svg" },
  "rx_illustration_roxybrowser.png": { light: "/assets/rx_illustration_roxybrowser-p-v0JGgd.png", dark: "/assets/rx_illustration_roxybrowser-Dku6CO6i.png" },
  "rx_illustration_stack.svg": { light: "/images/empty-illustrations/rx-illustration-stack-light.svg", dark: "/images/empty-illustrations/rx-illustration-stack-dark.svg" },
  "rx_illustration_star.svg": { light: "/images/empty-illustrations/rx-illustration-star-light.svg", dark: "/images/empty-illustrations/rx-illustration-star-dark.svg" },
  "rx_illustration_time.svg": { light: "/assets/rx_illustration_time-D81ezw8d.svg", dark: "/assets/rx_illustration_time-DIUk7DF4.svg" },
  "rx_illustration_transfer.svg": { light: "/assets/rx_illustration_transfer-DbcIkzBz.svg", dark: "/assets/rx_illustration_transfer-DHvos6Sh.svg" },
  "rx_illustration_user.svg": { light: "/images/empty-illustrations/rx-illustration-user-light.svg", dark: "/images/empty-illustrations/rx-illustration-user-dark.svg" },
  "rx_illustration_verification.svg": { light: "/images/empty-illustrations/rx-illustration-verification-light.svg", dark: "/images/empty-illustrations/rx-illustration-verification-dark.svg" },
  "rx_illustration_verification_code.svg": { light: "/assets/rx_illustration_verification_code-D0suGi3C.svg", dark: "/assets/rx_illustration_verification_code-DmdF8LCY.svg" },
  "rx_illustration_verification_mail.svg": { light: "/images/empty-illustrations/rx-illustration-verification-mail-light.svg", dark: "/images/empty-illustrations/rx-illustration-verification-mail-dark.svg" },
  "screen_lock.svg": { light: "/images/empty-illustrations/screen-lock-light.svg" },
};

export function emptyIllustration(name, dark) {
  const image = Object.hasOwn(illustrations, name) && illustrations[name];
  return image && (dark ? image.dark ?? image.light : image.light);
}
