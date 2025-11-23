import { NextRequest, NextResponse } from 'next/server';
import { captureSecurityEvent } from './monitoring';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;
const MAX_REQUESTS_PER_HOUR = 1000;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  entry.count++;
  return false;
}

function isHourlyRateLimited(ip: string): boolean {
  const hourlyKey = `${ip}:hourly`;
  const now = Date.now();
  const entry = rateLimitStore.get(hourlyKey);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(hourlyKey, {
      count: 1,
      resetTime: now + (60 * 60 * 1000) // 1 hour
    });
    return false;
  }
  
  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return true;
  }
  
  entry.count++;
  return false;
}

function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = getClientIP(request);
  
  // Block known bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /node/i,
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    captureSecurityEvent('bot_detected', {
      userAgent,
      ip,
      path: request.nextUrl.pathname
    });
    return true;
  }
  
  // Block requests without user agent
  if (!userAgent || userAgent.length < 10) {
    captureSecurityEvent('missing_user_agent', {
      ip,
      path: request.nextUrl.pathname
    });
    return true;
  }
  
  return false;
}

export function withSecurity(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(request);
    
    // Check for suspicious requests
    if (isSuspiciousRequest(request)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { 
          status: 403,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString()
          }
        }
      );
    }
    
    // Check rate limits
    if (isRateLimited(ip)) {
      captureSecurityEvent('rate_limited', {
        ip,
        path: request.nextUrl.pathname,
        limit: 'per_minute'
      });
      
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString()
          }
        }
      );
    }
    
    if (isHourlyRateLimited(ip)) {
      captureSecurityEvent('rate_limited', {
        ip,
        path: request.nextUrl.pathname,
        limit: 'per_hour'
      });
      
      return NextResponse.json(
        { error: 'Hourly rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS_PER_HOUR.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (60 * 60 * 1000)).toISOString()
          }
        }
      );
    }
    
    // Add security headers to response
    const response = await handler(request);
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    return response;
  };
}

export function validateWalletAddress(address: string): boolean {
  // Basic Solana address validation
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Solana addresses are 32-44 characters long and base58 encoded
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  
  // Check for valid base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) {
    return false;
  }
  
  return true;
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS patterns
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
}