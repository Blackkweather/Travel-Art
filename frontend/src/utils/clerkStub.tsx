// Stub for Clerk when not available
export const useAuthStub = () => ({
  isLoaded: true,
  isSignedIn: false,
  getToken: null,
  user: null
})

export const ClerkProviderStub: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

