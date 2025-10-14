"use client";

import Cookies from "js-cookie";

export const setRoleCookie = (role: "user" | "admin") => {
    Cookies.set("next-auth-role", role, { path: "/" });
};
