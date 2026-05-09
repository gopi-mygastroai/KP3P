-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "mrn" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "placeOfLiving" TEXT NOT NULL,
    "referredBy" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "currentAge" INTEGER NOT NULL,
    "ageAtDiagnosis" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "smokingStatus" TEXT NOT NULL,
    "smokingDetails" TEXT NOT NULL DEFAULT '',
    "primaryDiagnosis" TEXT NOT NULL,
    "diseaseDuration" TEXT NOT NULL,
    "montrealClass" TEXT NOT NULL,
    "previousSurgeries" TEXT NOT NULL,
    "currentDiseaseActivity" TEXT NOT NULL,
    "stoolFrequency" TEXT NOT NULL,
    "bloodInStool" TEXT NOT NULL,
    "abdominalPain" TEXT NOT NULL,
    "impactOnQoL" TEXT NOT NULL,
    "weightLoss" TEXT NOT NULL,
    "dateMostRecentLabs" TEXT NOT NULL,
    "dateMostRecentColono" TEXT NOT NULL,
    "recentLabValues" TEXT NOT NULL,
    "colonoscopyFindings" TEXT NOT NULL,
    "recentImaging" TEXT NOT NULL,
    "mostRecentDexa" TEXT NOT NULL,
    "currentIbdMedications" TEXT NOT NULL,
    "failedTreatments" TEXT NOT NULL,
    "tdmResults" TEXT NOT NULL,
    "currentSupplements" TEXT NOT NULL,
    "responseToTreatment" TEXT NOT NULL,
    "steroidUse" TEXT NOT NULL,
    "previousTreatmentsTried" TEXT NOT NULL,
    "tbScreening" TEXT NOT NULL,
    "hepBSurfaceAg" TEXT NOT NULL,
    "hepBSurfaceAb" TEXT NOT NULL,
    "hepBCoreAb" TEXT NOT NULL,
    "antiHcv" TEXT NOT NULL,
    "antiHiv" TEXT NOT NULL,
    "influenza" TEXT NOT NULL,
    "covid19" TEXT NOT NULL,
    "pneumococcal" TEXT NOT NULL,
    "hepatitisB" TEXT NOT NULL,
    "hepatitisA" TEXT NOT NULL,
    "hepatitisE" TEXT NOT NULL,
    "zoster" TEXT NOT NULL,
    "mmrVaricella" TEXT NOT NULL,
    "tetanusTdap" TEXT NOT NULL,
    "comorbidities" TEXT NOT NULL,
    "extraintestinalManif" TEXT NOT NULL,
    "pregnancyPlanning" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "specialConsiderations" TEXT NOT NULL,
    "documents" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
