'use strict';

// Minimal DOM model for order/identity/mutation assertions; no layout timings.
function createProfileTable(profiles = [], renderKeyFor = (profile) => `${profile.id}:${profile.version || 0}`) {
  const table = {
    children: [], placements: 0, removals: 0,
    get firstChild() { return this.children[0] || null; },
    querySelectorAll() { return [...this.children]; },
    insertBefore(row, anchor) {
      if (anchor !== null && anchor.parentNode !== this) throw new Error('Detached insertion anchor');
      if (row === anchor) return;
      if (row.parentNode) {
        const siblings = row.parentNode.children;
        siblings.splice(siblings.indexOf(row), 1);
      }
      const index = anchor === null ? this.children.length : this.children.indexOf(anchor);
      this.children.splice(index, 0, row);
      row.parentNode = this;
      this.placements += 1;
    },
    append(row) { this.insertBefore(row, null); },
    resetCounts() { this.placements = 0; this.removals = 0; },
  };
  function buildRow(profile) {
    return {
      dataset: { profileId: profile.id, renderKey: renderKeyFor(profile) },
      checkbox: { checked: false },
      parentNode: null,
      get nextSibling() {
        const siblings = this.parentNode?.children || [];
        return siblings[siblings.indexOf(this) + 1] || null;
      },
      querySelector() { return this.checkbox; },
      remove() {
        if (!this.parentNode) return;
        const parent = this.parentNode;
        parent.children.splice(parent.children.indexOf(this), 1);
        parent.removals += 1;
        this.parentNode = null;
      },
    };
  }
  profiles.forEach((profile) => table.append(buildRow(profile)));
  table.resetCounts();
  return { table, buildRow, renderKeyFor };
}

module.exports = { createProfileTable };
