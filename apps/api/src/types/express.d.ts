// Augment Express Request to include authenticated fields
// set by the `authenticate` middleware

declare namespace Express {
  interface Request {
    userId:   string;
    userRole: 'STUDENT' | 'ADMIN';
  }
}
