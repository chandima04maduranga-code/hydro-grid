// Greenhouse-level access rules inside a company.
// Company admins see every greenhouse; farm managers and field officers
// only see the greenhouses they are assigned to.
const Greenhouse = require('../models/Greenhouse');

const seesAllGreenhouses = (user) => user.role === 'admin';

// Mongo filter for the (non-archived) greenhouses this user may see
const greenhouseFilterFor = (user) =>
  seesAllGreenhouses(user)
    ? { company: user.company._id, archivedAt: null }
    : { company: user.company._id, archivedAt: null, assignedUsers: user._id };

// Ids of visible greenhouses, or null when the user sees all of them
const visibleGreenhouseIds = async (user) => {
  if (seesAllGreenhouses(user)) return null;
  const greenhouses = await Greenhouse.find(greenhouseFilterFor(user)).select('_id');
  return greenhouses.map((greenhouse) => greenhouse._id);
};

module.exports = { seesAllGreenhouses, greenhouseFilterFor, visibleGreenhouseIds };
