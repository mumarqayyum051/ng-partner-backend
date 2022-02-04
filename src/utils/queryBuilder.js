module.exports = function queryBuilder(searchCriteria, cursor, revert) {
  let query = {};
  if (cursor && cursor !== 'null' && cursor !== undefined) {
    if (revert) {
      query._id = { $lt: cursor };
    } else {
      query._id = { $gt: cursor };
    }
  }
  if (searchCriteria) {
    query = { ...query, ...searchCriteria };
  }
  // query.delete = false;
  return query;
};
