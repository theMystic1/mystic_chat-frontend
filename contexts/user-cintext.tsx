"use client";

import { apiClient } from "@/lib/api/axios-client";
import { UserType } from "@/utils/types";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type USERINFO = {
  user: UserType | null;
  loading: boolean;
};

const UserContext = createContext<USERINFO>({
  user: null,
  loading: false,
});

const UserProvider = ({
  children,
  token,
}: {
  children: ReactNode;
  token: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setLoading(true);
    const getMe = async () => {
      try {
        const { data } = await apiClient.get("/users/me");
        setUser(data?.data?.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getMe();
  }, [token]);
  return (
    <UserContext.Provider value={{ loading, user }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);

  if (!context) throw new Error("Usercontext was used outside its provider");

  return context;
};

export default UserProvider;
export { useUser };
