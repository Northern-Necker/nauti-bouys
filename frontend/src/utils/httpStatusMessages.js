export const getHttpStatusMessage = (status) => {
  const messages = {
    400: 'Bad request. Please try again later.',
    401: 'Unauthorized. Please check your credentials.',
    403: 'Forbidden. Please check your access.',
    404: 'Not found. Please try again later.',
    408: 'Request timeout. Please try again later.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again later.'
  }
  return messages[status] || 'An error occurred. Please try again later.'
}
