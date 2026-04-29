# 🚀 Production Deploy + Domain Setup

## 1. Deploy (Vercel)
- Go to https://vercel.com/new
- Import your GitHub repo
- Add env variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY

## 2. Custom Domain
- Go to Project → Settings → Domains
- Add domain (example: app.yourcompany.com)
- Update DNS (A or CNAME record)

## 3. Stripe Setup
- Create Stripe account
- Add STRIPE_SECRET_KEY in Supabase
- Create product + price

## 4. Email Setup
- Create account in Resend
- Add RESEND_API_KEY in Supabase

## 5. Deploy Edge Functions
- supabase functions deploy create-checkout
- supabase functions deploy send-invite-email

## 6. Final Result
- Live SaaS URL
- Payment working
- Invite email auto send

