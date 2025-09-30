
// Nest js
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  /**
   * Custom handleRequest to allow failed authentications to reach the controller.
   *
   * - `user` will be null if authentication failed.
   * - `info` (e.g. error message like 'user_exists') is attached to `request.authInfo`
   *   and can be used in the controller to redirect or display appropriate UI.
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.authInfo = info;
    return user || null;
  }

  /**
   * Passes the `mode` query parameter (e.g. login/signup) as the OAuth `state`.
   * This allows the OAuth flow to preserve context and act differently based on mode.
   */
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const mode = request.query.mode;

    return {
      state: mode,
    };
  }
}
