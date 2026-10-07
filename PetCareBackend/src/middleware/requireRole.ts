import type { RequestHandler } from 'express';
import type { UserRole } from '../models/user.ts';

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (_request, response, next) => {
    if (!response.locals.userId) {
      response.status(401).json({
        success: false,
        message: 'Sign in to continue.',
      });
      return;
    }

    const role = response.locals.userRole as UserRole | undefined;

    if (!role || !allowedRoles.includes(role)) {
      response.status(403).json({
        success: false,
        message: 'You do not have permission to access this feature.',
      });
      return;
    }

    next();
  };
}