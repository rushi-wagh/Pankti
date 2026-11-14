export const notFound = (req, res) => res.status(404).json({ error: 'Route not found' });

export const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({ error: status === 500 ? 'Something went wrong' : error.message });
};
