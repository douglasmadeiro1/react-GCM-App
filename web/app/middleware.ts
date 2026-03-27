import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  const publicRoutes = ['/login', '/reset-password'];
  const isPublic = publicRoutes.some((r) => path.startsWith(r));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 🔒 Proteção de rotas administrativas
  const adminRoutes = ['/users', '/admin', '/relatorios'];
  const isAdminRoute = adminRoutes.some((r) => path.startsWith(r));

  if (session && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nivel_usuario')
      .eq('id', session.user.id)
      .single();

    if (profile?.nivel_usuario !== 'gestor') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};