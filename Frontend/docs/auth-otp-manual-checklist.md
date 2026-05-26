# Auth OTP Manual Checklist

Date: 2026-02-24

## Scope
- Login with email or phone identifier
- OTP delivery choice (email or SMS)
- OTP verify and resend flow
- Error message clarity

## Test Cases
1. Valid login + valid OTP
- Enter valid identifier and password.
- Select a valid OTP channel.
- Enter the latest 6-digit OTP.
- Expected: user logs in and lands on home/dashboard.

2. Invalid credentials
- Enter wrong password with a real email/phone.
- Expected: login error is clear and not a raw backend message.

3. Invalid OTP code
- Request OTP, then enter a random wrong 6-digit code.
- Expected: user sees friendly "invalid code" message.

4. Expired OTP
- Request OTP, wait for expiry countdown to reach zero.
- Enter old code.
- Expected: expired code message and verify button is blocked/ineffective.

5. Resend cooldown
- Request OTP and immediately click resend.
- Expected: resend blocked by countdown, user sees wait state.

6. Backend resend cooldown
- Bypass UI cooldown (API/manual) and request too early.
- Expected: backend returns cooldown error and UI maps it to a friendly message.

7. Rate limit per identity
- Request OTP repeatedly for same identity in short window.
- Expected: rate-limit message shown, no raw server text.

8. Rate limit per device or IP
- From same browser/device, spam OTP requests.
- Expected: device/IP based limit triggers.

9. SMS not configured
- Choose SMS when SMS provider is disabled.
- Expected: clear fallback message to continue with email OTP.

10. OTP reuse protection
- Verify once successfully.
- Try verifying again with the same code.
- Expected: old code is rejected; user must request a new OTP.

## Expected Message Style
- Plain language
- No raw backend constants
- Consistent tense and punctuation
- Actionable guidance when possible
