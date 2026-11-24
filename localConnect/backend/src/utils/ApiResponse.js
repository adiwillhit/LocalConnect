export class ApiResponse {
  constructor(message = 'Success', data = null, meta = undefined) {
    this.success = true;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }
}

export const sendResponse = (res, statusCode, message, data = null, meta = undefined) => {
  return res.status(statusCode).json(new ApiResponse(message, data, meta));
};

