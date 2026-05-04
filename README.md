# DMS Navigator (Document Management System)

A modern, web-based Document Management System (DMS) built with Next.js 14, Tailwind CSS, and NextAuth. It provides a centralized dashboard for managing, editing, and organizing enterprise documents categorized by hospital/branch and document type.

## 🚀 Features

- **Centralized Document Storage**: Uses a local file system (via `UPLOAD_DIR` environment variable) simulating an FTP-like structure for backward compatibility.
- **Role-Based Access Control**: Secure authentication integrated via NextAuth.js. Differentiates between regular users, administrators, and viewers.
- **Automated Organization**: Files are structured hierarchically: `[Hospital] > [Document Type] > [File]`. Naming conventions are enforced automatically based on document type, description, and date (e.g., `hop-dong_bao-gia-xq_2024-05.docx`).
- **In-Browser Document Editor**: Integrated Syncfusion Document Editor (`@syncfusion/ej2-react-documenteditor`) to view and modify `.docx` files directly in the browser.
- **Resource Management**: Easily upload new documents, update existing versions of a document, or delete files directly from the intuitive dashboard.
- **Responsive UI**: Sleek, modern interface built using Tailwind CSS and Lucide React icons.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Document Processing**:
  - `@syncfusion/ej2-react-documenteditor` (Advanced Word Document Editor)
  - `mammoth` (DOCX to HTML conversion)
  - `html-to-docx` (HTML to DOCX conversion)
  - `xlsx` (Excel file parsing/writing)
- **File Uploads**: `formidable` (Multi-part form data processing)

## ⚙️ Prerequisites

- **Node.js** (v18 or newer recommended)
- **npm**, **yarn**, or **pnpm**

## 📦 Getting Started

### 1. Install dependencies
```bash
npm install
# or
yarn install
```

### 2. Set up Environment Variables
Create a `.env.local` file in the root directory with the following structure:

```env
# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_super_secret_token
NEXTAUTH_URL=http://localhost:3000

# File Storage Config
UPLOAD_DIR=E:\Tai_lieu # Absolute path to your local document storage directory
MAX_FILE_SIZE_MB=500
```

### 3. Run the Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the dashboard.

## 📁 Key Directory Structure
- `src/app/`: Next.js App Router routes (`/`, `/login`, `/manage`, `/view`, and API routes under `/api`).
- `src/components/`: Reusable UI components (`FileExplorer.jsx`, `ResourceManager.jsx`, `EditorComponent.jsx`).
- `src/lib/`: Core utilities including authentication logic (`auth.js`) and local file-system integration mocking FTP (`ftp.js`).

## 💡 Notes on Storage (`ftp.js`)
Despite the name `ftp.js`, the system currently utilizes Node.js local file system API (`fs/promises`) instead of a remote FTP server for performance and simplicity. It organizes folders by taking the root directory defined in `UPLOAD_DIR`. It automatically creates directories based on the categories selected during upload.
