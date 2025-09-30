# Security Guide

This document outlines the security considerations and best practices for the RapBattle Voter system.

## Security Architecture

### Authentication & Authorization

#### Event Tokens (JWT)
- **Purpose**: Control access to voting for specific events
- **Implementation**: HMAC-signed JWT tokens with expiration
- **Claims**: `event_id`, `exp`, `iat`
- **Security**: Tokens are signed with a secret key and have expiration times

#### Admin Authentication
- **Method**: API key authentication via `X-Admin-Key` header
- **Scope**: Administrative functions only
- **Protection**: Strong, randomly generated keys

### Data Protection

#### Vote Integrity
- **Device Fingerprinting**: Stable device IDs prevent duplicate votes
- **IP Tracking**: Rate limiting and abuse detection
- **Database Constraints**: Unique constraints prevent duplicate votes per device per battle

#### Data Encryption
- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: Database encryption (configure at database level)
- **Secrets**: Environment variables for sensitive configuration

## Security Features

### 1. Rate Limiting

```python
# Per-IP rate limiting via Redis
IP_RATE_LIMIT = 5  # votes per IP per window
RATE_LIMIT_WINDOW = 300  # 5 minutes
```

**Implementation**:
- Soft cap approach (flag but don't hard reject)
- Sliding window using Redis
- Per-IP tracking with automatic expiration

### 2. Input Validation

**API Layer**:
- Pydantic schemas for all request/response models
- Type validation and sanitization
- SQL injection prevention via SQLAlchemy ORM

**Frontend Layer**:
- Client-side validation for UX
- Server-side validation as primary security layer

### 3. Device Fingerprinting

```typescript
// Stable device identification
const deviceHash = btoa(randomId + userAgent + timestamp).slice(0, 32);
localStorage.setItem('rapbattles_device_hash', deviceHash);
```

**Features**:
- Combines UUID, user agent, and timestamp
- Stored in localStorage for persistence
- Prevents duplicate votes from same device

### 4. Database Security

**Schema Design**:
```sql
-- Unique constraint prevents duplicate votes
ALTER TABLE votes ADD CONSTRAINT unique_battle_device_vote 
UNIQUE (battle_id, device_hash);

-- Indexes for performance without exposing data
CREATE INDEX idx_battle_choice ON votes (battle_id, choice);
```

**Protection Mechanisms**:
- Parameterized queries via SQLAlchemy
- No raw SQL execution
- Database-level constraints
- Connection pooling with limits

## Threat Model & Mitigations

### 1. Vote Manipulation

**Threat**: Users attempting to vote multiple times or manipulate results

**Mitigations**:
- Device fingerprinting (one vote per device per battle)
- IP-based rate limiting
- Database constraints
- Append-only vote log with timestamps

### 2. Brute Force Attacks

**Threat**: Attempting to guess admin keys or event tokens

**Mitigations**:
- Strong, randomly generated secrets
- Rate limiting on authentication endpoints
- Short-lived event tokens with expiration
- Logging and monitoring of failed attempts

### 3. DDoS Attacks

**Threat**: Overwhelming the system with requests

**Mitigations**:
- Rate limiting per IP
- Redis-based caching to reduce database load
- Connection pooling and timeouts
- Nginx load balancing and request filtering

### 4. Data Breaches

**Threat**: Unauthorized access to sensitive data

**Mitigations**:
- Environment variable secrets management
- HTTPS encryption in transit
- Database access controls
- Regular security updates
- Minimal data collection (no personal information)

## Security Configuration

### Environment Variables

```bash
# Required security settings
SIGNING_SECRET=<strong-random-string>  # JWT signing key
ADMIN_KEY=<strong-random-string>       # Admin authentication
DATABASE_URL=postgresql://...          # Database connection
REDIS_URL=redis://...                  # Redis connection

# Optional security settings
IP_RATE_LIMIT=5                        # Votes per IP per window
RATE_LIMIT_WINDOW=300                  # Rate limit window in seconds
EVENT_DEFAULT_WINDOW=180               # Default token expiration
```

### Production Security Checklist

#### Infrastructure
- [ ] HTTPS/TLS encryption enabled
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Regular security updates applied
- [ ] Database access restricted to application
- [ ] Redis access restricted to application

#### Application
- [ ] Strong secrets generated and configured
- [ ] Rate limiting enabled and tested
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive information
- [ ] Logging configured for security events

#### Monitoring
- [ ] Failed authentication attempts logged
- [ ] Rate limit violations monitored
- [ ] Database access patterns monitored
- [ ] SSL certificate expiration monitored
- [ ] Regular security scans scheduled

## Security Best Practices

### 1. Secret Management

```bash
# Generate strong secrets
openssl rand -base64 32  # For SIGNING_SECRET
openssl rand -base64 32  # For ADMIN_KEY
```

**Do**:
- Use cryptographically secure random generators
- Store secrets in environment variables
- Rotate secrets regularly
- Never commit secrets to version control

**Don't**:
- Use predictable or weak secrets
- Hardcode secrets in application code
- Share secrets in plain text
- Use the same secret across environments

### 2. Database Security

```python
# Connection string with SSL
DATABASE_URL = "postgresql+psycopg://user:pass@host:5432/db?sslmode=require"

# Connection pool limits
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600
)
```

### 3. API Security

```python
# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origins only
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Minimal methods
    allow_headers=["Authorization", "Content-Type"],  # Specific headers
)
```

### 4. Error Handling

```python
# Don't expose internal details
try:
    # Database operation
    pass
except Exception as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(
        status_code=500,
        detail="Internal server error"
    )
```

## Incident Response

### Security Incident Plan

1. **Detection**: Monitor logs for suspicious activity
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

### Log Monitoring

```bash
# Monitor failed authentications
grep "401\|403" /var/log/nginx/access.log

# Monitor rate limit violations
grep "429" /var/log/nginx/access.log

# Monitor database errors
docker logs rapbattles_api | grep "ERROR"
```

### Emergency Contacts

- **System Administrator**: [contact]
- **Security Team**: [contact]
- **Database Administrator**: [contact]

## Compliance Considerations

### Data Privacy
- **Personal Data**: System collects minimal personal data (device fingerprints)
- **Data Retention**: Vote data can be archived after events
- **Data Access**: Admin access controls and audit logging

### GDPR Compliance
- **Right to Erasure**: Vote data can be anonymized
- **Data Portability**: Vote results can be exported
- **Consent**: Users consent to vote by participating

### Security Standards
- **OWASP Top 10**: Protection against common web vulnerabilities
- **ISO 27001**: Information security management practices
- **SOC 2**: Security, availability, and confidentiality controls

## Regular Security Tasks

### Daily
- Monitor logs for suspicious activity
- Check system health and performance
- Verify SSL certificate validity

### Weekly
- Review failed authentication attempts
- Check for security updates
- Monitor rate limiting effectiveness

### Monthly
- Rotate secrets and keys
- Review access logs
- Update security documentation
- Test backup and recovery procedures

### Quarterly
- Security audit and penetration testing
- Review and update threat model
- Security training for team members
- Compliance review and updates
