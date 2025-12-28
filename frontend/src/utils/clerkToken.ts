// Helper to get Clerk session token
// This is used by the API client to get the current Clerk session token
let getClerkTokenFn: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (fn: () => Promise<string | null>) => {
  getClerkTokenFn = fn;
};

export const getClerkToken = async (): Promise<string | null> => {
  if (getClerkTokenFn) {
    return await getClerkTokenFn();
  }
  return null;
};






