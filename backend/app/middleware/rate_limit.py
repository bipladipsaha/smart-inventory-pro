"""Rate limiting middleware for public endpoints."""
import time
from functools import wraps
from flask import request, jsonify
from collections import defaultdict
import threading


class RateLimiter:
    """Simple in-memory rate limiter.
    
    For production, consider using Redis for distributed rate limiting.
    """
    
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 1 minute in seconds
        self._requests = defaultdict(list)
        self._lock = threading.Lock()
    
    def _get_client_ip(self) -> str:
        """Get client IP address, handling proxies."""
        # Check for X-Forwarded-For header (behind proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        # Check for X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fall back to direct remote address
        return request.remote_addr or "unknown"
    
    def _cleanup_old_requests(self, client_ip: str, current_time: float) -> None:
        """Remove requests older than the window."""
        cutoff = current_time - self.window_size
        self._requests[client_ip] = [
            ts for ts in self._requests[client_ip] if ts > cutoff
        ]
    
    def is_rate_limited(self) -> tuple[bool, dict]:
        """Check if the current request should be rate limited.
        
        Returns:
            Tuple of (is_limited, info_dict)
        """
        client_ip = self._get_client_ip()
        current_time = time.time()
        
        with self._lock:
            self._cleanup_old_requests(client_ip, current_time)
            
            request_count = len(self._requests[client_ip])
            
            if request_count >= self.requests_per_minute:
                # Calculate retry time
                oldest_request = min(self._requests[client_ip])
                retry_after = int(oldest_request + self.window_size - current_time) + 1
                
                return True, {
                    "remaining": 0,
                    "retry_after": max(1, retry_after),
                    "limit": self.requests_per_minute
                }
            
            # Record this request
            self._requests[client_ip].append(current_time)
            
            return False, {
                "remaining": self.requests_per_minute - request_count - 1,
                "retry_after": 0,
                "limit": self.requests_per_minute
            }


# Global rate limiter instance for public endpoints
public_rate_limiter = RateLimiter(requests_per_minute=30)


def rate_limit(limiter: RateLimiter = None):
    """Decorator to apply rate limiting to a route.
    
    Args:
        limiter: RateLimiter instance to use. Defaults to public_rate_limiter.
    
    Usage:
        @app.route("/public-endpoint")
        @rate_limit()
        def public_endpoint():
            ...
    """
    if limiter is None:
        limiter = public_rate_limiter
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            is_limited, info = limiter.is_rate_limited()
            
            if is_limited:
                response = jsonify({
                    "error": "Rate limit exceeded. Please try again later.",
                    "retry_after": info["retry_after"]
                })
                response.status_code = 429
                response.headers["Retry-After"] = str(info["retry_after"])
                response.headers["X-RateLimit-Limit"] = str(info["limit"])
                response.headers["X-RateLimit-Remaining"] = "0"
                return response
            
            # Execute the route function
            result = f(*args, **kwargs)
            
            # Add rate limit headers to successful responses
            if hasattr(result, "headers"):
                result.headers["X-RateLimit-Limit"] = str(info["limit"])
                result.headers["X-RateLimit-Remaining"] = str(info["remaining"])
            
            return result
        
        return decorated_function
    
    return decorator
