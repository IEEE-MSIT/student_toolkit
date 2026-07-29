import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import api from "../services/api/axiosInstance";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      isAuthenticated: false,
      isLoading: true,

      setUser: (user, token) => {
        Cookies.set("token", token, {
          expires: 7,
          secure: true,
          sameSite: "Lax",
        });

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (user) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : user,
        }));
      },

      logout: () => {
        Cookies.remove("token");

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      restoreSession: async () => {
        const token = Cookies.get("token");

        if (token) {
          try {
            const response = await api.get("/user/profile");
            set({
              token,
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            Cookies.remove("token");
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
