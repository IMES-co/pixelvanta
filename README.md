# PIXELVANTA

Digital Image Rights & Copyright Protection Platform.

## Included
- Responsive public landing page and declaration UI
- Supabase Auth integration (email/password)
- PostgreSQL schema with row-level security
- Private image bucket and per-user upload paths
- Public record lookup and reference page
- Legal information pages and infringement-reporting UI scaffold

## Important implementation status
This is a starter implementation, not a legally reviewed or fully production-certified service. The declaration form is deliberately disabled until Supabase is configured. Infringement reports are not submitted until a secure server-side review endpoint is implemented. Do not advertise verification, official registration, or legal guarantees.

## 1. Configure Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication settings, enable email/password and configure allowed redirect URLs.
4. Copy the Project URL and anon/public key into `config.js`.
5. Never place the `service_role` key in browser code.
6. Configure email confirmation and abuse controls.

## 2. Image storage and public display
The storage bucket is private. The current declaration form uploads into a user-specific folder. For a production public record, create a Supabase Edge Function that:
- accepts a record reference,
- checks that the record is public,
- returns only a short-lived signed image URL,
- never returns `contact_email` or `legal_notes`,
- rate-limits requests and validates input.

The sample record page uses a signed URL request from the browser; for strict privacy and anti-enumeration, replace this with the Edge Function described above.

## 3. GitHub Pages deployment
1. Create a GitHub repository named `pixelvanta` (or your preferred repo).
2. Upload the contents of this folder to the repository root.
3. Replace canonical URLs, sitemap and `PUBLIC_SITE_URL` with your actual Pages/custom-domain URL.
4. In repository Settings → Pages, deploy from the `main` branch and `/ (root)`.
5. Add your custom domain and enforce HTTPS if using one.
6. Add all deployed URLs to Supabase Auth redirect URL allowlist.

GitHub Pages hosts only static frontend files. It cannot securely run server-side code, private authentication logic, database writes, secret keys, or secure file processing. Supabase provides those backend services.

## 4. Production work required before launch
- Add an Edge Function for signed image URLs and infringement report intake.
- Add server-side MIME sniffing, malware scanning and image metadata/EXIF privacy stripping.
- Add CAPTCHA/Turnstile, rate limiting, email verification and anti-enumeration.
- Add edit/update workflow with audit history and soft-delete/retention rules.
- Add private contact data access only through authenticated, authorised flows.
- Add report evidence storage in a separate private bucket and reviewer/admin workflow.
- Add admin roles, moderation queue, appeal and content-removal procedures.
- Add backup, monitoring, incident response and data-retention schedule.
- Add CSP/security headers (GitHub Pages has limited header control; use Cloudflare or another edge host if needed).
- Review Indian copyright, intermediary, privacy and consumer laws with qualified counsel.
- Replace placeholders such as support email, privacy contact, effective dates, operator details and governing jurisdiction.

## 5. Legal and product safeguards
A declaration is a user-submitted statement, not proof of authorship or official registration. Copyright may arise automatically under applicable law, but ownership and exceptions are fact-specific. Avoid displaying legal verification badges. Do not send takedown notices automatically. Keep private contact details and legal notes out of public record queries.

## 6. Local preview
Open `index.html` in a browser. Backend actions will remain disabled until configuration is complete. For best results use a local static server during development.
