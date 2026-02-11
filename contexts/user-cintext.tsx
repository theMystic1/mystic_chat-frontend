"use client";

import { apiClient } from "@/lib/api/axios-client";
import { UserType } from "@/utils/types";
import { useSearchParams } from "next/navigation";
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
  setUser: React.Dispatch<React.SetStateAction<any>>;
};

const UserContext = createContext<USERINFO>({
  user: null,
  loading: false,
  setUser: () => {},
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
  const params = useSearchParams();

  const refetch = params.get("refetch");

  // console.log(user);

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
  }, [token, refetch]);
  return (
    <UserContext.Provider value={{ loading, user, setUser }}>
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
