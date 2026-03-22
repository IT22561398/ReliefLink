CREATE SCHEMA IF NOT EXISTS volunteer_service;

CREATE TYPE volunteer_service."VolunteerAvailability" AS ENUM ('available', 'busy', 'offline');
CREATE TYPE volunteer_service."ResourceAvailability" AS ENUM ('available', 'reserved', 'unavailable');
CREATE TYPE volunteer_service."AssignmentStatus" AS ENUM ('assigned', 'in_progress', 'completed');

CREATE TABLE volunteer_service."Volunteer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skillSet" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "availabilityStatus" volunteer_service."VolunteerAvailability" NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Volunteer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE volunteer_service."Resource" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "availabilityStatus" volunteer_service."ResourceAvailability" NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE volunteer_service."Assignment" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "volunteerId" TEXT,
  "resourceId" TEXT,
  "assignedBy" TEXT NOT NULL,
  "status" volunteer_service."AssignmentStatus" NOT NULL DEFAULT 'assigned',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Volunteer_userId_key" ON volunteer_service."Volunteer"("userId");

ALTER TABLE volunteer_service."Assignment"
ADD CONSTRAINT "Assignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES volunteer_service."Volunteer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE volunteer_service."Assignment"
ADD CONSTRAINT "Assignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES volunteer_service."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
