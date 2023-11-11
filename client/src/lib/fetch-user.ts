import Cookies from "js-cookie";
import { User } from "../store/user-context";
import axios from "axios";

export default async function fetchUser(): Promise<User | null> {
  const token = Cookies.get("Authorization");
  if (!token) {
    return null;
  }
  try {
    const res = await axios.get("/api/whoami", {
      headers: { Authorization: token },
    });
    console.log(res.data);
    return res.data as User;
  } catch (e: any) {
    console.error(e);
    return null;
  }
}
