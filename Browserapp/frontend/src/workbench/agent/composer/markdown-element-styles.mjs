export const codeCopyCss = `
:host {
  display: inline-flex;
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
  opacity: 0.78;
  transition: opacity 0.16s ease;
}

:host(:hover),
:host(:focus-within) {
  opacity: 1;
}

.copy-control {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: currentColor;
  cursor: pointer;
  outline: none;
  transition: color 0.16s ease, transform 0.16s ease;
}

.copy-control:hover,
.copy-control:focus-visible {
  color: var(--color-text-secondary);
}

.copy-control:active {
  transform: scale(0.94);
}

.copy-control.copied {
  color: var(--color-text-success-primary);
}

roxy-svg-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  pointer-events: none;
}
`;

export const tableCopyCss = `
:host {
  display: inline-flex;
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
  opacity: 0.78;
  transition: opacity 0.16s ease;
}

:host(:hover),
:host(:focus-within) {
  opacity: 1;
}

.copy-control {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: currentColor;
  cursor: pointer;
  outline: none;
  transition: color 0.16s ease, transform 0.16s ease;
}

.copy-control:hover,
.copy-control:focus-visible {
  color: var(--color-text-secondary);
}

.copy-control:active {
  transform: scale(0.94);
}

.copy-control.copied {
  color: var(--color-text-success-primary);
}

roxy-svg-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  pointer-events: none;
}
`;

export const tokenCss = `
:host {
  display: inline-flex;
  max-width: 100%;
  vertical-align: middle;
}

:host([kind="profile"]) {
  width: max-content;
  max-width: none;
  white-space: nowrap;
}

.agent-token {
  display: inline-flex;
  max-width: 280px;
  min-height: 24px;
  align-items: center;
  box-sizing: border-box;
  gap: 4px;
  margin: 0 2px;
  padding: 2px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 18px;
  vertical-align: middle;
  white-space: nowrap;
}

.agent-token__icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: none;
  align-items: center;
  justify-content: center;
}

.agent-token__icon roxy-svg-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.agent-token__label {
  min-width: 0;
  overflow: hidden;
  pointer-events: none;
  text-overflow: ellipsis;
}

.agent-token__profile-prefix,
.agent-token__profile-detail {
  display: inline-flex;
  width: max-content;
  min-height: 24px;
  flex: none;
  align-items: center;
  box-sizing: border-box;
  gap: 4px;
  padding: 2px 6px;
}

.agent-token__profile-prefix {
  border-radius: 8px 0 0 8px;
  background: var(--color-bg-tag-purple, #ebe9fe);
}

.agent-token__profile-detail {
  min-width: 0;
  border-radius: 0 8px 8px 0;
  background: var(--color-bg-tag-purple-hover, #d9d6fe);
}

.agent-token__profile-names {
  flex: none;
  white-space: nowrap;
}

.agent-token__remove {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 12px;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.agent-token--profile {
  width: max-content;
  max-width: none;
  flex: none;
  color: var(--color-text-tag-purple, #5925dc);
  background: transparent;
  font-size: 14px;
  font-weight: 400;
}

.agent-token--profile .agent-token__label {
  overflow: visible;
  flex: none;
  text-overflow: clip;
  white-space: nowrap;
}

.agent-token--profile:not(.agent-token--profile-empty) {
  gap: 0;
  padding: 0;
}

.agent-token--profile-empty {
  gap: 4px;
  padding: 2px 6px;
  border: 1px dashed #7a5af8;
  background: var(--color-bg-tag-purple, #ebe9fe);
}

.agent-token--skill {
  color: var(--color-text-tag-pink, #c11574);
  background: var(--color-bg-tag-pink, #fce7f6);
}

.agent-token--script {
  color: var(--color-text-tag-blue, #175cd3);
  background: var(--color-bg-tag-blue, #d1e9ff);
}

.agent-token--input,
.agent-token--textarea,
.agent-token--url,
.agent-token--project {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}

/*
 * Keep the host attribute as a styling source as well as the inner kind
 * class. This is important for tokens inserted through v-html: the host
 * attribute is the serialized source of truth, while the shadow component
 * may still be upgraded after the HTML has been inserted.
 */
:host([kind="input"]) .agent-token,
:host([kind="textarea"]) .agent-token,
:host([kind="project"]) .agent-token {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}


.agent-token--input-empty {
  border: 1px dashed currentColor;
  color: #c2410c;
  background: rgba(251, 146, 60, 0.12);
}

:host([kind="input"][target=""]) .agent-token,
:host([kind="input"]:not([target])) .agent-token,
:host([kind="textarea"][target=""]) .agent-token,
:host([kind="textarea"]:not([target])) .agent-token,
:host([kind="project"][target=""]) .agent-token,
:host([kind="project"]:not([target])) .agent-token {
  border: 1px dashed currentColor;
  color: #c2410c;
  background: rgba(251, 146, 60, 0.12);
}
`;
