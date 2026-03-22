CREATE SCHEMA IF NOT EXISTS auth_service;

CREATE TYPE auth_service."Role" AS ENUM ('requester', 'volunteer', 'coordinator', 'admin');

CREATE TABLE auth_service."User" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" auth_service."Role" NOT NULL DEFAULT 'requester',
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON auth_service."User"("email");
