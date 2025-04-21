import { User } from 'src/db';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
