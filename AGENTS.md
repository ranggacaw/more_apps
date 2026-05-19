# MORE Clinic App Notes

## Stack
- Laravel 12 backend with Inertia.js and React frontend
- PostgreSQL as the primary runtime database
- Midtrans for consultation payments
- Database queue for notifications and reminders

## Domain Rules
- Roles are stored on `users.role` and must be one of `patient`, `doctor`, or `admin`
- Patients register through the public form; doctor and admin accounts are seeded or created by the team
- A booking is only confirmed after the payment callback marks the related payment as paid
- Locked slots expire after 15 minutes and the scheduler releases them again

## Key Routes
- `/dashboard` redirects users to their role-specific dashboard
- `/patient/dashboard`, `/doctor/dashboard`, and `/admin/dashboard` are the primary operational pages
- `/book-consultation` is the patient booking entry point
- `/payment/webhook` receives Midtrans callbacks

## Local Development
- Use `docker-compose up --build` for the Docker-based stack
- If Midtrans keys are missing, the checkout page falls back to demo payment simulation buttons for local MVP testing
