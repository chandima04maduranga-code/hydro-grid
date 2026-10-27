// The login token lives in an httpOnly cookie: the browser sends it with
// every API call, but page scripts (and anything injected into the page)
// cannot read it, unlike a token kept in localStorage.
const SESSION_COOKIE = 'hg_session';
const SESSION_HOURS = 8;

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api'
});

// "Keep me logged in" keeps the cookie after the browser closes (until the
// token expires); otherwise it is dropped when the browser closes
const setSessionCookie = (res, token, remember) =>
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(),
    ...(remember ? { maxAge: SESSION_HOURS * 60 * 60 * 1000 } : {})
  });

const clearSessionCookie = (res) => res.clearCookie(SESSION_COOKIE, cookieOptions());

module.exports = { SESSION_COOKIE, SESSION_HOURS, setSessionCookie, clearSessionCookie };
