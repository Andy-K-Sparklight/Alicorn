import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleHelloAlicorn } from "./HelloAlicorn";

interface APICall {
  action: Actions;
}

enum Actions {
  HelloAlicorn = "HelloAlicorn",
}

export default (req: VercelRequest, res: VercelResponse): void => {
  const aCall = req.body as APICall;
  switch (aCall.action) {
    case Actions.HelloAlicorn:
      handleHelloAlicorn(req, res);
      return;
  }
};
