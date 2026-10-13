-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone_no" VARCHAR(15),
    "role" "Role" NOT NULL,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "students" (
    "student_id" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "programme" VARCHAR(100),
    "faculty" VARCHAR(100),
    "semester" SMALLINT,
    "lecturer_id" VARCHAR(20),

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "lecturer_id" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "department" VARCHAR(100),
    "office_room" VARCHAR(50),
    "position" VARCHAR(50),

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("lecturer_id")
);

-- CreateTable
CREATE TABLE "admins" (
    "admin_id" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "position" VARCHAR(50),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "slot_id" SERIAL NOT NULL,
    "lecturer_id" VARCHAR(20) NOT NULL,
    "slot_date" DATE NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "slot_status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "appointment_id" SERIAL NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "lecturer_id" VARCHAR(20) NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "appointment_status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "consultation_notes" (
    "note_id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "action_plan" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("note_id")
);

-- CreateTable
CREATE TABLE "consultation_limits" (
    "limit_id" SERIAL NOT NULL,
    "lecturer_id" VARCHAR(20) NOT NULL,
    "max_per_day" SMALLINT NOT NULL DEFAULT 6,
    "max_per_week" SMALLINT NOT NULL DEFAULT 20,
    "max_per_student_week" SMALLINT NOT NULL DEFAULT 2,
    "session_duration" SMALLINT NOT NULL DEFAULT 30,
    "min_notice_hours" SMALLINT NOT NULL DEFAULT 24,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_limits_pkey" PRIMARY KEY ("limit_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" SERIAL NOT NULL,
    "admin_id" VARCHAR(20) NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_lecturer_id_idx" ON "students"("lecturer_id");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_user_id_key" ON "lecturers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE INDEX "availability_slots_lecturer_id_slot_date_idx" ON "availability_slots"("lecturer_id", "slot_date");

-- CreateIndex
CREATE INDEX "appointments_lecturer_id_appointment_status_idx" ON "appointments"("lecturer_id", "appointment_status");

-- CreateIndex
CREATE INDEX "appointments_student_id_appointment_status_idx" ON "appointments"("student_id", "appointment_status");

-- CreateIndex
CREATE INDEX "appointments_slot_id_idx" ON "appointments"("slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_active_slot_key" ON "appointments"("slot_id") WHERE (appointment_status IN ('PENDING', 'APPROVED', 'RESCHEDULED'));

-- CreateIndex
CREATE UNIQUE INDEX "consultation_notes_appointment_id_key" ON "consultation_notes"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_limits_lecturer_id_key" ON "consultation_limits"("lecturer_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("lecturer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("lecturer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("lecturer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("slot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_limits" ADD CONSTRAINT "consultation_limits_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("lecturer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written (Prisma cannot model CHECK constraints).
-- FR09: a slot must end after it starts.
ALTER TABLE "availability_slots"
    ADD CONSTRAINT "availability_slots_time_check" CHECK ("end_time" > "start_time");
