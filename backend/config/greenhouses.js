// Greenhouse options and code format.
// Codes use the full district name and a two-digit unit number,
// e.g. "Nuwara Eliya GH-01", numbered separately per district.
const SYSTEM_TYPES = ['nft', 'dwc', 'growBag', 'ebbFlow', 'vertical'];
const GREENHOUSE_STATUSES = ['active', 'maintenance', 'inactive'];

const greenhouseCode = (district, number) => `${district} GH-${String(number).padStart(2, '0')}`;

module.exports = { SYSTEM_TYPES, GREENHOUSE_STATUSES, greenhouseCode };
