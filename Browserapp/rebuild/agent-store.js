"use strict";
// Metadata owners serialize their own edits. Other owners and live runs may
// save meanwhile, so drafts must remain outside the shared object until durable.
function saveFields(service, fields) {
  return service.save({
    snapshot: () => ({ ...service.data, ...fields }),
    commit: () => Object.assign(service.data, fields),
  });
}
module.exports = { saveFields };
