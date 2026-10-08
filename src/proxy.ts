import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // API, Next ichki fayllari va nuqtali (statik) fayllardan tashqari hammasi
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
