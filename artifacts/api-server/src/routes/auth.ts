import { getAuth } from "@clerk/express";
import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { ensureDbUser } from "../lib/jitUser";

const router: IRouter = Router();

router.get("/auth/user", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.json(GetCurrentAuthUserResponse.parse({ user: null }));
    return;
  }

  const user = await ensureDbUser(auth.userId);
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    }),
  );
});

export default router;
