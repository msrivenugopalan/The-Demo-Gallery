# Photo Sharing Platform

A beginner-friendly full-stack photo sharing application built with Next.js, TypeScript and Docker based storage system.

## Project overview

This project demonstrates a simple event-based photo workflow:

1. An admin creates an event and adds team members.
2. Team members upload photos to the event.
3. The admin reviews uploaded photographs and selects the ones to publish.
4. A gallery is created with a PIN-protected customer link.
5. Customers use the shareable link and PIN to view the published gallery.

The app is intentionally modular so a beginner can follow the code and learn the basic flow of authentication, authorization, uploads, APIs, and UI.

## Technology stack

- Frontend: Next.js 16 with App Router and TypeScript
- Styling: Tailwind CSS
- Backend: Next.js API routes
- Data storage: MinIO (S3-compatible object storage)
- Testing: Vitest

## Demo credentials

- Admin: `admin@demo.com` / `admin123`
- Team member: `team@demo.com` / `team123`

## Recommended learning path

If you are new to full-stack development, this project is organized so you can follow the layers in order:

- `src/components` contains the UI screens
- `src/app/api` contains backend API endpoints
- `src/lib` contains reusable logic and data access
- `src/app` contains page routing

## System architecture

```mermaid
flowchart LR
    User[Admin / Team Member / Customer] --> Frontend[Next.js Frontend]
    Frontend --> API[Next.js API Routes]
    API --> Store[MinIO(docker based storage)]
    API --> Files[Local File Uploads]
    Store --> Metadata[Event, Photo, Gallery Metadata]
    Frontend --> Gallery[PIN-protected Gallery Page]
```

## Database design (demo version)

The project uses a lightweight docker based store for simplicity. In a production application, this would be replaced with PostgreSQL or MongoDB.

### Entities

- `users`
  - id
  - name
  - email
  - password
  - role
  - createdAt
- `events`
  - id
  - name
  - description
  - adminId
  - memberIds
  - createdAt
- `photos`
  - id
  - eventId
  - uploadedBy
  - filename
  - storageUrl
  - fileSize
  - createdAt
- `galleries`
  - id
  - eventId
  - title
  - pin
  - selectedPhotoIds
  - createdAt

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the app in your browser:

- Admin / team login: http://localhost:3000
- Customer gallery example: http://localhost:3000/gallery/<gallery-id>

## Important notes about persistence

This demo stores:

- metadata in `data/store.json`
- uploaded images in `public/uploads`

This is good for learning and local demos, but it is not production-grade storage. For production, use object storage like S3 or GCP Cloud Storage.

## Deployment steps

This project is ready for deployment on Vercel.

### Option 1: Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Deploy the app.
4. Set the production branch and domain.

### Option 2: Self-hosted Node server

1. Build the app:

```bash
npm run build
```

2. Start the production server:

```bash
npm run start
```

### Production improvements to consider

- Replace file-system uploads with AWS S3 or GCP Cloud Storage
- Move persistent data to PostgreSQL
- Add proper image thumbnails and CDN delivery
- Add a real session store and secure secret management

## Testing

Run the project tests with:

```bash
npm run test
```

The current tests cover:

- authentication and authorization rules
- event access checks
- team member restrictions
- gallery publish permissions

## Known limitations

- Uploaded files are stored locally for this demo
- There is no real payment, billing, or cloud deployment configured yet
- The app uses a simple JSON file store instead of a production database
- The customer gallery is protected by a simple PIN flow for demonstration purposes

## Good next improvements

- Add PostgreSQL and Prisma
- Add S3 upload integration
- Create admin-only photo selection and bulk actions
- Improve gallery API security with signed URLs and expiration
- Add CI/CD and automated deployment

## Developed by

## Srivenugopalan M
Passionate towards Software Development and Embedded Systems
