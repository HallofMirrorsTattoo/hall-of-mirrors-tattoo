import { NextRequest, NextResponse } from 'next/server';

const BLOCKED_HOSTS = [
  'hallofmirrorstattoo.com',
  'www.hallofmirrorstattoo.com',
  'hallofmirrorstattoo.co.uk',
  'www.hallofmirrorstattoo.co.uk',
];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  if (BLOCKED_HOSTS.some(h => host === h)) {
    return new NextResponse('This site is currently under construction.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
