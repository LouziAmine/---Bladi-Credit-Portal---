import { dispatch, DispatchOutcome, registerRoutes } from './core/demo-router';
import { ensureSeeded } from './seed/seed';

import { authRoutes } from './handlers/auth.handler';
import { referenceDataRoutes } from './handlers/reference-data.handler';
import { parametersRoutes } from './handlers/parameters.handler';
import { catalogRoutes } from './handlers/catalog.handler';
import { usersRoutes } from './handlers/users.handler';
import { demandRoutes } from './handlers/demand.handler';
import { simulationRoutes } from './handlers/simulation.handler';
import { enterpriseRoutes } from './handlers/enterprise.handler';
import { enterpriseLinkRoutes } from './handlers/enterprise-link.handler';
import { clientPortfolioRoutes } from './handlers/client-portfolio.handler';
import { invitationRoutes } from './handlers/invitation.handler';
import { documentRoutes } from './handlers/document.handler';
import { documentRequestRoutes } from './handlers/document-request.handler';
import { clientDocumentRequestRoutes } from './handlers/client-document-request.handler';
import { notificationRoutes } from './handlers/notification.handler';
import { creditFileRoutes } from './handlers/credit-file.handler';
import { clientCreditFileRoutes } from './handlers/client-credit-file.handler';
import { earlyRepaymentRoutes } from './handlers/early-repayment.handler';
import { bamVerificationRoutes } from './handlers/bam-verification.handler';
import { auditLogRoutes } from './handlers/audit-log.handler';
import { demandImportRoutes } from './handlers/demand-import.handler';

let routesRegistered = false;
let seedPromise: Promise<void> | null = null;

function registerAll(): void {
  if (routesRegistered) {
    return;
  }
  registerRoutes(authRoutes);
  registerRoutes(referenceDataRoutes);
  registerRoutes(parametersRoutes);
  registerRoutes(catalogRoutes);
  registerRoutes(usersRoutes);
  registerRoutes(demandRoutes);
  registerRoutes(simulationRoutes);
  registerRoutes(enterpriseRoutes);
  registerRoutes(enterpriseLinkRoutes);
  registerRoutes(clientPortfolioRoutes);
  registerRoutes(invitationRoutes);
  registerRoutes(documentRoutes);
  registerRoutes(documentRequestRoutes);
  registerRoutes(clientDocumentRequestRoutes);
  registerRoutes(notificationRoutes);
  registerRoutes(creditFileRoutes);
  registerRoutes(clientCreditFileRoutes);
  registerRoutes(earlyRepaymentRoutes);
  registerRoutes(demandImportRoutes);
  registerRoutes(bamVerificationRoutes);
  registerRoutes(auditLogRoutes);
  routesRegistered = true;
}

function ensureReady(): Promise<void> {
  registerAll();
  if (!seedPromise) {
    seedPromise = ensureSeeded();
  }
  return seedPromise;
}

export async function handleDemo(method: string, url: string, body: unknown): Promise<DispatchOutcome> {
  await ensureReady();
  return dispatch(method, url, body);
}
