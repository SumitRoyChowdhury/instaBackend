function parsePagination(query) {
  const isPositiveInteger = (value) => typeof value === "string" && /^[1-9]\d*$/.test(value);
  if ((query.page !== undefined && !isPositiveInteger(query.page)) ||
      (query.limit !== undefined && !isPositiveInteger(query.limit))) {
    return null;
  }

  return {
    page: query.page === undefined ? 1 : Number(query.page),
    limit: Math.min(query.limit === undefined ? 10 : Number(query.limit), 50),
  };
}

module.exports = parsePagination;