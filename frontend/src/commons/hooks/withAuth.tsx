import { useEffect, useState } from "react";
import { getAccessToken } from "../libraries/token";

export function withAuth<T>(
  WrappedComponent: React.ComponentType<T & { isAuthenticated: boolean }>
) {
  return function AuthenticatedComponent(props: T) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
      const token = getAccessToken();
      setIsAuthenticated(!!token); // 토큰 있으면 true, 없으면 false
    }, []);

    return <WrappedComponent {...props} isAuthenticated={isAuthenticated} />;
  };
}
