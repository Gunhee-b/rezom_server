export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = `Request failed with status ${response.status}`;
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } else {
      const textError = await response.text();
      if (textError) {
        errorMessage = textError;
      }
    }
  } catch {
    // Fallback to default message if parsing fails
  }

  throw new ApiError(response.status, errorMessage, response);
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const handleAsyncError = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: unknown) => void
): T => {
  return ((...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      console.error('Async error:', error);
      onError?.(error);
      throw error;
    });
  }) as T;
};