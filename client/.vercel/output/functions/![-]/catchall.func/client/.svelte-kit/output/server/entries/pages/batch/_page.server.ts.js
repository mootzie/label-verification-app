import { redirect } from "@sveltejs/kit";
const load = () => {
  redirect(301, "/");
};
export {
  load
};
