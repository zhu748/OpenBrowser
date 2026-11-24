"use strict";

const { fromRoxy } = require('./profile-dto');
const crypto = require('node:crypto');
const { fingerprintVersion } = require('../automation/fingerprint/generation');
const allocations = new WeakMap();

function allocationProof(engine, id, seed) {
  if (!allocations.has(engine)) allocations.set(engine, { key: crypto.randomBytes(32), consumed: new Set() });
  return crypto.createHmac('sha256', allocations.get(engine).key).update(id).update('\0').update(seed).digest('hex');
}

function previewIdentity(engine, profile) {
  return { profileId: profile.id, seed: profile.fingerprintSeed, version: profile.fingerprintVersion,
    allocation: allocationProof(engine, profile.id, profile.fingerprintSeed) };
}

function hasAllocationProof(engine, draft) {
  const { profileId: id, seed, allocation } = draft || {};
  return typeof id === 'string'
    && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)
    && typeof seed === 'string' && /^[a-f0-9]{32}$/.test(seed)
    && typeof allocation === 'string' && /^[a-f0-9]{64}$/.test(allocation)
    && allocations.has(engine)
    && crypto.timingSafeEqual(Buffer.from(allocation, 'hex'), Buffer.from(allocationProof(engine, id, seed), 'hex'));
}

function reusePreviewIdentity(engine, draft, edited) {
  // A UA-only preview can retain a committed seed or a live preview allocation.
  const version = fingerprintVersion(draft.version);
  if (edited && draft.seed && draft.seed === edited.fingerprintSeed && version === fingerprintVersion(edited.fingerprintVersion))
    return { id: edited.id, seed: draft.seed, version };
  if (hasAllocationProof(engine, draft) && (edited ? draft.profileId === edited.id
    : !engine.profiles.has(draft.profileId) && !allocations.get(engine).consumed.has(draft.profileId))) {
    return { id: draft.profileId, seed: draft.seed, version };
  }
  throw new Error('指纹预览已失效，请刷新后重试');
}

// A preview reserves only a random UUID, never the right to replace a profile.
// Templates, imports and repeated submissions may reuse the same draft. Give
// each of those a fresh identity once its original UUID has been used.
function profileFromPreview(engine, input, allocated = new Set()) {
  const id = input?._fingerprintDraft?.profileId;
  const available = hasAllocationProof(engine, input?._fingerprintDraft)
    && !allocations.get(engine).consumed.has(id)
    && !engine.profiles.has(id) && !allocated.has(id);
  const profile = fromRoxy(input, available ? { id } : {});
  allocated.add(profile.id);
  return profile;
}

async function savePreviewProfiles(engine, profiles, prepareReply) {
  const reply = await engine.commitProfiles(profiles, { prepareReply });
  // Consume only after durable success. A failed save can retry the same
  // preview; purging a saved window must never make its old proof reusable.
  const state = allocations.get(engine);
  if (state) for (const profile of profiles) state.consumed.add(profile.id);
  return reply;
}

module.exports = { profileFromPreview, previewIdentity, reusePreviewIdentity, savePreviewProfiles };
