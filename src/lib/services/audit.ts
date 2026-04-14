import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AuditAction, AuditEntityType } from "@prisma/client";

interface LogAuditParams {
  domainId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId?: string;
  userName?: string;
  changes?: Record<string, unknown>;
}

export async function logAudit(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        domainId: params.domainId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId ?? null,
        userName: params.userName ?? null,
        changes: params.changes ? (params.changes as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export async function getAuditLog(
  entityType: AuditEntityType,
  entityId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

export async function getDomainAuditLog(
  domainId: string,
  options?: { limit?: number; offset?: number; entityType?: AuditEntityType }
) {
  return prisma.auditLog.findMany({
    where: {
      domainId,
      ...(options?.entityType && { entityType: options.entityType }),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}
