<script setup lang="ts">
import { computed, reactive } from 'vue';
import { protocols, proxyAddress, type ProxyRecord } from './api';

interface ProxyDraft {
  name: string;
  protocol: string;
  host: string;
  port: number | string;
  username: string;
  password: string;
  remark: string;
  maxConcurrency: number | string;
}
const { initial, busy, save, cancel } = defineProps<{
  initial: ProxyRecord | null; busy: boolean;
  save: (patch: Record<string, unknown>) => void; cancel: () => void;
}>();
const draft = reactive<ProxyDraft>({
  name: initial?.name ?? '', protocol: initial?.protocol ?? 'http', host: initial?.host ?? '', port: initial?.port ?? '',
  username: initial?.username ?? '', password: initial?.password ?? '', remark: initial?.remark ?? '',
  maxConcurrency: initial?.maxConcurrency ?? 0,
});
const auth = reactive({ clear: false });
const options = computed(() => [...new Set([...protocols, draft.protocol])]);

function submit() {
  const host = draft.host.trim();
  if (!host || busy) return;
  const port = Number(draft.port);
  const fields: Record<string, unknown> = { ...draft, host, port, maxConcurrency: Number(draft.maxConcurrency) };
  if (auth.clear) {
    const bare = proxyAddress({ host, port });
    fields.raw = `${draft.protocol}://${bare}`;
    fields.proxyAuthAction = 'clear';
  }
  save(fields);
}
</script>

<template>
  <form class="panel editor proxy-form" aria-labelledby="proxy-form-title" @submit.prevent="submit">
    <h2 id="proxy-form-title">{{ initial ? '编辑代理' : '新增代理' }}</h2>
    <fieldset class="form-section" :disabled="busy">
      <legend>代理连接</legend>
      <label>名称<input v-model="draft.name" maxlength="120"></label>
      <div class="form-grid">
        <label>协议<select v-model="draft.protocol" aria-label="代理协议"><option v-for="item in options" :key="item" :value="item">{{ item.toUpperCase() }}</option></select></label>
        <label>地址<input v-model="draft.host" required spellcheck="false" maxlength="1000" placeholder="主机名或 IP 地址"></label>
        <label>端口<input v-model.number="draft.port" type="number" required min="1" max="65535"></label>
      </div>
      <div class="form-grid">
        <label>用户名<input v-model="draft.username" autocomplete="off" :disabled="auth.clear"></label>
        <label>密码<input v-model="draft.password" type="password" autocomplete="new-password" :disabled="auth.clear"></label>
      </div>
      <label v-if="initial?.username || initial?.password" class="check-field"><input v-model="auth.clear" type="checkbox">清除认证</label>
      <label>同时运行窗口数上限<input v-model.number="draft.maxConcurrency" type="number" min="0" max="1000" required></label>
      <small>0 表示不限</small>
      <label>备注<textarea v-model="draft.remark" maxlength="500" rows="2"></textarea></label>
    </fieldset>
    <div class="toolbar"><button type="submit" class="primary" :disabled="busy || !draft.host.trim()">保存代理</button><button type="button" :disabled="busy" @click="cancel">取消</button></div>
  </form>
</template>
