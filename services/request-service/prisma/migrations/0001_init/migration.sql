CREATE SCHEMA IF NOT EXISTS request_service;

CREATE TYPE request_service."RequestCategory" AS ENUM ('water', 'food', 'medicine', 'shelter', 'rescue', 'transport', 'other');
CREATE TYPE request_service."Urgency" AS ENUM ('low', 'medium', 'high');
CREATE TYPE request_service."RequestStatus" AS ENUM ('pending', 'matched', 'assigned', 'in_progress', 'completed', 'cancelled');

CREATE TABLE request_service."ReliefRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "category" request_service."RequestCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "urgency" request_service."Urgency" NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "peopleCount" INTEGER NOT NULL,
  "status" request_service."RequestStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReliefRequest_pkey" PRIMARY KEY ("id")
);
