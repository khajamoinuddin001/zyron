import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, JwtPayload } from '@/core/auth/jwt'

export function getAuthUser(req: NextRequest): JwtPayload | null {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): JwtPayload | NextResponse {
  const user = getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

export function requireSuperAdmin(req: NextRequest): JwtPayload | NextResponse {
  const user = requireAuth(req)
  if (user instanceof NextResponse) return user
  
  console.log('[DEBUG_AUTH]', user);
  
  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return user
}
