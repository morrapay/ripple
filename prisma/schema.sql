-- CreateEnum
CREATE TYPE "FlowType" AS ENUM ('HAPPY_FLOW', 'UNHAPPY_FLOW');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED');

-- CreateEnum
CREATE TYPE "BehavioralEventType" AS ENUM ('page_view', 'click', 'submit', 'field_change', 'error_message_view', 'error_message', 'error', 'tooltip_view', 'tooltip', 'popup_view', 'popup', 'toast', 'experiment_trigger');

-- CreateEnum
CREATE TYPE "ApplicationEventType" AS ENUM ('API_TRIGGERED', 'OFFLINE_PROCESS');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'DEPRECATED', 'READY_FOR_BRAZE');

-- CreateEnum
CREATE TYPE "ContentApprovalStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('LEGAL_SIGNOFF', 'LOCALIZATION');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('JOURNEY', 'STEP', 'COMMUNICATION', 'BEHAVIORAL_EVENT', 'APPLICATION_EVENT', 'COMMUNICATION_POINT', 'PREFERENCE_CATEGORY');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('MUST_PRECEDE', 'MUTUALLY_EXCLUSIVE', 'TRIGGERS');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('PROMOTIONAL', 'TRANSACTIONAL', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "BrazeAvailability" AS ENUM ('AVAILABLE', 'NOT_AVAILABLE', 'REGION_SPECIFIC');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'PRODUCT_MANAGER', 'ANALYST', 'CONTENT_WRITER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_GRANTED', 'APPROVAL_REJECTED', 'SYSTEM', 'INFO');

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "brazeAvailability" "BrazeAvailability" NOT NULL,
    "regionAvailability" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "useCase" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelGovernance" (
    "id" TEXT NOT NULL,
    "channelId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelGovernance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportedService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PRODUCT_MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EVENT_APPROVAL',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnedRule" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "sourceType" TEXT NOT NULL DEFAULT 'USER_CORRECTION',
    "correctionCount" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnedRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriftSignal" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriftSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventsManuallyConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "generationContext" JSONB,
    "selectedServiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flowType" "FlowType" NOT NULL,
    "fileUrl" TEXT,
    "figmaLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralEvent" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" "BehavioralEventType" NOT NULL,
    "description" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "userProperties" JSONB,
    "eventProperties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehavioralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStepBehavioralEvent" (
    "journeyStepId" TEXT NOT NULL,
    "behavioralEventId" TEXT NOT NULL,

    CONSTRAINT "JourneyStepBehavioralEvent_pkey" PRIMARY KEY ("journeyStepId","behavioralEventId")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "ApplicationEventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "handshakeContext" JSONB NOT NULL,
    "businessRationale" JSONB,
    "producerMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStepApplicationEvent" (
    "journeyStepId" TEXT NOT NULL,
    "applicationEventId" TEXT NOT NULL,

    CONSTRAINT "JourneyStepApplicationEvent_pkey" PRIMARY KEY ("journeyStepId","applicationEventId")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audience" TEXT,
    "objective" TEXT,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "platform" TEXT NOT NULL DEFAULT 'Web',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "entryCriteria" JSONB,
    "exitCriteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStep" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "journeyId" TEXT,
    "flowIndex" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'STATE',
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "conditionConfig" JSONB,
    "waitDuration" TEXT,
    "splitVariants" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationPoint" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "journeyStepId" TEXT,
    "name" TEXT NOT NULL,
    "triggerEvent" TEXT,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "communicationPointId" TEXT,
    "templateId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Untitled',
    "channel" TEXT,
    "communicationType" "CommunicationType",
    "category" TEXT,
    "preferenceGroup" TEXT,
    "preferenceCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentOutline" JSONB,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvalCategory" TEXT,
    "owner" TEXT,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'DRAFT',
    "contentApprovalStatus" "ContentApprovalStatus",
    "contentApprovedBy" TEXT,
    "contentApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralTaxonomyType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "BehavioralTaxonomyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "category" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBankItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT,
    "dimension" TEXT,

    CONSTRAINT "QuestionBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveSnapshot" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "author" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyEdge" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "sourceStepId" TEXT NOT NULL,
    "targetStepId" TEXT NOT NULL,
    "label" TEXT,
    "condition" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "text" TEXT NOT NULL,
    "parentId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "jiraKey" TEXT,
    "jiraUrl" TEXT,
    "assignee" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationDependency" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "fromCommunicationId" TEXT NOT NULL,
    "toCommunicationId" TEXT NOT NULL,
    "type" "DependencyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceCategory" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canOptOut" BOOLEAN NOT NULL DEFAULT true,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportedService_code_key" ON "SupportedService"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Communication_communicationPointId_key" ON "Communication"("communicationPointId");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralTaxonomyType_code_key" ON "BehavioralTaxonomyType"("code");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_domainId_createdAt_idx" ON "AuditLog"("domainId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationDependency_fromCommunicationId_toCommunication_key" ON "CommunicationDependency"("fromCommunicationId", "toCommunicationId");

-- AddForeignKey
ALTER TABLE "ChannelGovernance" ADD CONSTRAINT "ChannelGovernance_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_selectedServiceId_fkey" FOREIGN KEY ("selectedServiceId") REFERENCES "SupportedService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralEvent" ADD CONSTRAINT "BehavioralEvent_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStepBehavioralEvent" ADD CONSTRAINT "JourneyStepBehavioralEvent_journeyStepId_fkey" FOREIGN KEY ("journeyStepId") REFERENCES "JourneyStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStepBehavioralEvent" ADD CONSTRAINT "JourneyStepBehavioralEvent_behavioralEventId_fkey" FOREIGN KEY ("behavioralEventId") REFERENCES "BehavioralEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStepApplicationEvent" ADD CONSTRAINT "JourneyStepApplicationEvent_journeyStepId_fkey" FOREIGN KEY ("journeyStepId") REFERENCES "JourneyStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStepApplicationEvent" ADD CONSTRAINT "JourneyStepApplicationEvent_applicationEventId_fkey" FOREIGN KEY ("applicationEventId") REFERENCES "ApplicationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStep" ADD CONSTRAINT "JourneyStep_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStep" ADD CONSTRAINT "JourneyStep_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPoint" ADD CONSTRAINT "CommunicationPoint_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPoint" ADD CONSTRAINT "CommunicationPoint_journeyStepId_fkey" FOREIGN KEY ("journeyStepId") REFERENCES "JourneyStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_communicationPointId_fkey" FOREIGN KEY ("communicationPointId") REFERENCES "CommunicationPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveSnapshot" ADD CONSTRAINT "ArchiveSnapshot_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyEdge" ADD CONSTRAINT "JourneyEdge_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyEdge" ADD CONSTRAINT "JourneyEdge_sourceStepId_fkey" FOREIGN KEY ("sourceStepId") REFERENCES "JourneyStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyEdge" ADD CONSTRAINT "JourneyEdge_targetStepId_fkey" FOREIGN KEY ("targetStepId") REFERENCES "JourneyStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationDependency" ADD CONSTRAINT "CommunicationDependency_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationDependency" ADD CONSTRAINT "CommunicationDependency_fromCommunicationId_fkey" FOREIGN KEY ("fromCommunicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationDependency" ADD CONSTRAINT "CommunicationDependency_toCommunicationId_fkey" FOREIGN KEY ("toCommunicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceCategory" ADD CONSTRAINT "PreferenceCategory_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

