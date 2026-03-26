// lib/api-response.js
export function successResponse(data, message = "Success") {
  return Response.json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  message,
  code = "INTERNAL_ERROR",
  status = 500,
  errors = null,
) {
  return Response.json(
    {
      success: false,
      message,
      code,
      errors,
    },
    { status },
  );
}
