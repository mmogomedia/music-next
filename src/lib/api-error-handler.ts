/**
 * API Error Handling Utilities
 * Provides consistent error responses across all API endpoints
 */

export interface ApiErrorDetails {
  timestamp: string;
  type: string;
  solution?: string;
  jobId?: string;
  fileSize?: number;
  fileType?: string;
  [key: string]: any;
}

export interface ApiErrorResponse {
  error: string;
  details: ApiErrorDetails;
}

/**
 * HTTP Status Code Error Messages
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in and try again.',
  403: "Access denied. You don't have permission to perform this action.",
  404: 'Resource not found. Please check your request and try again.',
  409: 'Conflict. The resource already exists or is in use.',
  413: 'File too large. Please choose a smaller file.',
  415: 'Unsupported file type. Please choose a supported format.',
  422: 'Invalid data. Please check your input and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timeout. Please try again later.',
};

/**
 * Get user-friendly error message for HTTP status codes
 */
export function getHttpErrorMessage(
  status: number,
  customMessage?: string
): string {
  if (customMessage) {
    return customMessage;
  }

  return (
    HTTP_ERROR_MESSAGES[status] ||
    `Request failed with status ${status}. Please try again.`
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 500,
  details: Partial<ApiErrorDetails> = {}
): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  const errorResponse: ApiErrorResponse = {
    error: errorMessage,
    details: {
      timestamp: new Date().toISOString(),
      type: 'api_error',
      ...details,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle R2/Cloud Storage upload errors
 */
export function handleR2UploadError(
  response: Response,
  uploadUrl: string,
  key: string,
  fileSize: number,
  fileType: string
): Response {
  const status = response.status;

  // Log detailed error information
  console.error('R2 upload failed:', {
    status,
    statusText: response.statusText,
    uploadUrl,
    key,
    fileSize,
    fileType,
    timestamp: new Date().toISOString(),
  });

  let errorMessage = getHttpErrorMessage(status);

  // Provide more specific error messages for R2 uploads
  switch (status) {
    case 400:
      errorMessage =
        'Invalid upload request. Please check your file and try again.';
      break;
    case 401:
      errorMessage =
        'Upload authorization failed. Please refresh and try again.';
      break;
    case 403:
      errorMessage = 'Upload access denied. Please check your permissions.';
      break;
    case 404:
      errorMessage = 'Upload endpoint not found. Please try again later.';
      break;
    case 413:
      errorMessage = 'File too large. Please choose a smaller file.';
      break;
    case 429:
      errorMessage =
        'Too many upload requests. Please wait a moment and try again.';
      break;
    case 500:
      errorMessage = 'Cloud storage server error. Please try again later.';
      break;
    case 503:
      errorMessage =
        'Cloud storage temporarily unavailable. Please try again later.';
      break;
  }

  return createErrorResponse(errorMessage, status, {
    type: 'r2_upload_error',
    uploadUrl,
    key,
    fileSize,
    fileType,
  });
}

/**
 * Handle configuration errors (missing environment variables)
 */
export function handleConfigError(
  variableName: string,
  exampleValue?: string
): Response {
  const errorMessage = `${variableName} environment variable is not configured`;
  const solution = exampleValue
    ? `Please set ${variableName} in your environment variables (e.g., "${exampleValue}")`
    : `Please set ${variableName} in your environment variables`;

  return createErrorResponse(errorMessage, 500, {
    type: 'configuration_error',
    solution,
    variable: variableName,
  });
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  message: string,
  field?: string
): Response {
  return createErrorResponse(message, 400, {
    type: 'validation_error',
    field,
  });
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message: string = 'Unauthorized'): Response {
  return createErrorResponse(message, 401, {
    type: 'authentication_error',
  });
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  resource: string,
  identifier?: string
): Response {
  const message = identifier
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;

  return createErrorResponse(message, 404, {
    type: 'not_found_error',
    resource,
    identifier,
  });
}

/**
 * Handle database errors
 */
export function handleDatabaseError(operation: string, error: Error): Response {
  console.error(`Database error during ${operation}:`, error);

  return createErrorResponse(
    `Failed to ${operation}. Please try again later.`,
    500,
    {
      type: 'database_error',
      operation,
    }
  );
}

/**
 * Handle generic server errors
 */
export function handleServerError(
  error: Error | string,
  context?: string
): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  console.error(`Server error${context ? ` in ${context}` : ''}:`, error);

  return createErrorResponse(errorMessage, 500, {
    type: 'server_error',
    context,
  });
}

/**
 * Handle file upload errors
 */
export function handleFileUploadError(
  error: Error | string,
  fileDetails?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  }
): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  return createErrorResponse(errorMessage, 500, {
    type: 'file_upload_error',
    ...fileDetails,
  });
}
