import { h as api, hn as debounce, v as useUser } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';

let writes = Promise.resolve();
const save = debounce(({ user, notify, remarkDisplayStatus }) => {
  writes = writes.then(async () => {
    if (Boolean(user.userConfig?.remarkDisplayStatus) === remarkDisplayStatus) return;
    try {
      const { code, msg } = await api.base.userSetUserConfigCreate({ remarkDisplayStatus });
      notify(code, msg);
      if (code === 0) await user.fetchUserInfo();
    } catch (error) { notify(-1, error?.message || $t('操作失败')); }
  });
}, 500);

export function useRemarkPreference() {
  const user = useUser();
  const [, notify] = useFeedback();
  return remarkDisplayStatus => save({ user, notify, remarkDisplayStatus });
}

function useRemarkDisplay() {
  const updatePreference = useRemarkPreference();
  function toggleRemarkDisplayStatus(row) {
    row.extend = !row.extend;
    updatePreference(row.extend);
  }
  return { toggleRemarkDisplayStatus };
}

export { useRemarkDisplay as t };
